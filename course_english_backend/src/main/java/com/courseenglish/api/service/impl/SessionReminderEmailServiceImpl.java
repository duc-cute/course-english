package com.courseenglish.api.service.impl;

import com.courseenglish.api.config.MailProperties;
import com.courseenglish.api.domain.Enrollment;
import com.courseenglish.api.domain.ClassSession;
import com.courseenglish.api.domain.SessionReminder;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.dto.notification.SessionReminderNotifyContext;
import com.courseenglish.api.repository.EnrollmentRepository;
import com.courseenglish.api.repository.ClassSessionRepository;
import com.courseenglish.api.repository.SessionReminderRepository;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.service.SessionReminderEmailService;
import com.courseenglish.api.service.mail.MailSenderService;
import com.courseenglish.api.service.mail.MailTemplateService;
import com.courseenglish.api.service.mail.RenderedMailMessage;
import com.courseenglish.api.util.AppConstants;
import com.courseenglish.api.util.constant.SessionReminderStatusEnum;
import com.courseenglish.api.util.constant.SessionStatusEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class SessionReminderEmailServiceImpl implements SessionReminderEmailService {

    private static final Logger log = LoggerFactory.getLogger(SessionReminderEmailServiceImpl.class);
    private static final ZoneId TEACHING_PLAN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm", Locale.forLanguageTag("vi-VN"))
            .withZone(TEACHING_PLAN_ZONE);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("EEEE, d/M/yyyy", Locale.forLanguageTag("vi-VN"))
            .withZone(TEACHING_PLAN_ZONE);

    private final SessionReminderRepository sessionReminderRepository;
    private final ClassSessionRepository classSessionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final MailTemplateService mailTemplateService;
    private final MailSenderService mailSenderService;
    private final MailProperties mailProperties;

    public SessionReminderEmailServiceImpl(
            SessionReminderRepository sessionReminderRepository,
            ClassSessionRepository classSessionRepository,
            EnrollmentRepository enrollmentRepository,
            UserRepository userRepository,
            MailTemplateService mailTemplateService,
            MailSenderService mailSenderService,
            MailProperties mailProperties) {
        this.sessionReminderRepository = sessionReminderRepository;
        this.classSessionRepository = classSessionRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.mailTemplateService = mailTemplateService;
        this.mailSenderService = mailSenderService;
        this.mailProperties = mailProperties;
    }

    @Override
    @Async("emailExecutor")
    public void dispatchReminderAsync(UUID reminderId) {
        processReminder(reminderId);
    }

    @Override
    @Transactional
    public void processReminder(UUID reminderId) {
        if (!AppConstants.notificationEmailEnabled) {
            log.debug("Skip session reminder email: NOTIFICATION_EMAIL_ENABLED is false");
            return;
        }
        if (!mailProperties.isConfigured()) {
            log.warn("Skip session reminder email: mail is not configured");
            return;
        }

        SessionReminder reminder = sessionReminderRepository.findById(reminderId).orElse(null);
        if (reminder == null || reminder.isVoided()) {
            return;
        }
        if (reminder.getStatus() != SessionReminderStatusEnum.PENDING) {
            return;
        }
        if (reminder.getRemindAt().isAfter(Instant.now())) {
            return;
        }

        ClassSession session = classSessionRepository
                .findByIdAndVoidedFalseWithClassroomAndLesson(reminder.getSessionId())
                .orElse(null);
        if (session == null
                || session.getStatus() == SessionStatusEnum.CANCELLED
                || !session.getStartAt().isAfter(Instant.now())) {
            reminder.setStatus(SessionReminderStatusEnum.CANCELLED);
            sessionReminderRepository.save(reminder);
            return;
        }

        User teacher = userRepository.findByIdAndVoidedFalse(reminder.getTeacherId()).orElse(null);
        if (teacher == null || teacher.getEmail() == null || teacher.getEmail().isBlank()) {
            reminder.setStatus(SessionReminderStatusEnum.FAILED);
            reminder.setLastError("Giáo viên không có email.");
            sessionReminderRepository.save(reminder);
            return;
        }

        try {
            // Gửi tới: giáo viên + học sinh đang ACTIVE trong lớp.
            LinkedHashMap<String, String> recipients = new LinkedHashMap<>();
            recipients.put(teacher.getEmail().trim(), teacher.getName());

            UUID classroomId = session.getClassroom() != null ? session.getClassroom().getId() : null;
            if (classroomId != null) {
                List<Enrollment> enrollments = enrollmentRepository
                        .findActiveByClassroomIdsWithStudent(Collections.singleton(classroomId));
                for (Enrollment enrollment : enrollments) {
                    if (enrollment.getStudent() == null || enrollment.getStudent().getEmail() == null) continue;
                    String email = enrollment.getStudent().getEmail().trim();
                    if (!email.isBlank()) {
                        if (!recipients.containsKey(email)) {
                            recipients.put(email, enrollment.getStudent().getName());
                        }
                    }
                }
            }

            int successCount = 0;
            String lastError = null;
            for (var entry : recipients.entrySet()) {
                try {
                    SessionReminderNotifyContext context = buildContext(session, teacher, entry.getKey(), entry.getValue());
                    RenderedMailMessage mail = mailTemplateService.renderSessionReminder(context);
                    mailSenderService.send(mail);
                    successCount++;
                } catch (Exception ex) {
                    lastError = ex.getMessage();
                    log.warn("Failed to send session reminder {} to {}: {}", reminderId, entry.getKey(), ex.getMessage());
                }
            }

            if (successCount > 0) {
                reminder.setStatus(SessionReminderStatusEnum.SENT);
                reminder.setSentAt(Instant.now());
                reminder.setLastError(lastError);
            } else {
                reminder.setStatus(SessionReminderStatusEnum.FAILED);
                reminder.setLastError(lastError != null ? lastError : "Không thể gửi email cho người nhận.");
            }
            sessionReminderRepository.save(reminder);
        } catch (Exception ex) {
            log.warn("Failed to send session reminder {}: {}", reminderId, ex.getMessage());
            reminder.setStatus(SessionReminderStatusEnum.FAILED);
            reminder.setLastError(ex.getMessage());
            sessionReminderRepository.save(reminder);
        }
    }

    private SessionReminderNotifyContext buildContext(ClassSession session, User teacher, String recipientEmail, String recipientName) {
        String classroomName = session.getClassroom() != null ? safe(session.getClassroom().getName()) : "";
        String lessonTitle = session.getLesson() != null ? safe(session.getLesson().getTitle()) : "";
        String teacherName = safe(teacher.getName());
        if (teacherName.isBlank()) teacherName = "Giáo viên";
        String resolvedRecipientName = safe(recipientName);
        if (resolvedRecipientName.isBlank()) resolvedRecipientName = "bạn";

        LocalDate today = Instant.now().atZone(TEACHING_PLAN_ZONE).toLocalDate();
        LocalDate startDate = session.getStartAt() != null ? session.getStartAt().atZone(TEACHING_PLAN_ZONE).toLocalDate() : null;
        boolean startingSoon = startDate != null && startDate.equals(today);

        String scheduleUrl = normalizeBase(mailProperties.getFrontendBaseUrl()) + "/admin/schedule";

        return new SessionReminderNotifyContext(
                recipientEmail.trim(),
                resolvedRecipientName,
                teacherName,
                classroomName,
                safe(session.getTitle()),
                lessonTitle,
                session.getStartAt(),
                session.getEndAt(),
                safe(session.getMeetLink()),
                scheduleUrl,
                startingSoon);
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private static String normalizeBase(String base) {
        if (base == null || base.isBlank()) {
            return "";
        }
        String trimmed = base.trim();
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }

    public static String formatTime(Instant instant) {
        return TIME_FMT.format(instant);
    }

    public static String formatDate(Instant instant) {
        return DATE_FMT.format(instant);
    }
}
