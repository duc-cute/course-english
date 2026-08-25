package com.courseenglish.api.service.mail.impl;

import com.courseenglish.api.config.MailProperties;
import com.courseenglish.api.domain.dto.notification.ExamAssignedNotifyContext;
import com.courseenglish.api.domain.dto.notification.LessonPublishedNotifyContext;
import com.courseenglish.api.domain.dto.notification.LessonPublishedNotifyContext.Recipient;
import com.courseenglish.api.domain.dto.notification.SessionReminderNotifyContext;
import com.courseenglish.api.service.impl.SessionReminderEmailServiceImpl;
import com.courseenglish.api.service.mail.MailTemplateService;
import com.courseenglish.api.service.mail.RenderedMailMessage;
import com.courseenglish.api.util.AppConstants;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.time.Year;

@Service
public class MailTemplateServiceImpl implements MailTemplateService {

    private final SpringTemplateEngine templateEngine;
    private final MailProperties mailProperties;

    public MailTemplateServiceImpl(SpringTemplateEngine templateEngine, MailProperties mailProperties) {
        this.templateEngine = templateEngine;
        this.mailProperties = mailProperties;
    }

    @Override
    public RenderedMailMessage renderLessonPublished(LessonPublishedNotifyContext context, Recipient recipient) {
        String brandName = getBrandName();
        String lessonTitle = safeTrim(context.lesson().getTitle());
        String subjectLine = "Bài mới: " + lessonTitle;
        String actorName = context.actor() != null && context.actor().getName() != null
                ? context.actor().getName().trim()
                : "Giáo viên";
        String lessonUrl = buildLessonUrl(context.linkPath());
        String studentName = recipient.name() != null && !recipient.name().isBlank()
                ? recipient.name().trim()
                : "bạn";
        String subjectName = context.subject() != null ? safeTrim(context.subject().getName()) : "";
        String classroomName = context.classroom() != null ? safeTrim(context.classroom().getName()) : "";
        String actorAvatarUrl = resolvePublicMediaUrl(
                context.actor() != null ? context.actor().getAvatarUrl() : "");
        String coverImageUrl = resolvePublicMediaUrl(context.lesson().getCoverImageUrl());

        Context ctx = new Context();
        ctx.setVariable("studentName", studentName);
        ctx.setVariable("actorName", actorName);
        ctx.setVariable("actorAvatarUrl", actorAvatarUrl);
        ctx.setVariable("lessonTitle", lessonTitle);
        ctx.setVariable("subjectName", subjectName);
        ctx.setVariable("classroomName", classroomName);
        ctx.setVariable("subjectLine", context.body() != null ? context.body().replace(" · ", " • ") : "");
        ctx.setVariable("lessonUrl", lessonUrl);
        ctx.setVariable("coverImageUrl", coverImageUrl);
        ctx.setVariable("brandName", brandName);
        ctx.setVariable("currentYear", Year.now().getValue());

        String htmlBody = templateEngine.process("mail/lesson-published", ctx);
        String textBody = templateEngine.process("mail/lesson-published.txt", ctx);

        return new RenderedMailMessage(recipient.email(), subjectLine, htmlBody, textBody);
    }

    @Override
    public RenderedMailMessage renderExamAssigned(
            ExamAssignedNotifyContext context, ExamAssignedNotifyContext.Recipient recipient) {
        String brandName = getBrandName();
        String examTitle = safeTrim(context.examPaper().getTitle());
        String subjectLine = "Đề thi mới: " + examTitle;
        String actorName = context.actor() != null && context.actor().getName() != null
                ? context.actor().getName().trim()
                : "Giáo viên";
        String examUrl = buildLessonUrl(context.linkPath());
        String studentName = recipient.name() != null && !recipient.name().isBlank()
                ? recipient.name().trim()
                : "bạn";
        String classroomName = context.classroom() != null ? safeTrim(context.classroom().getName()) : "";
        String actorAvatarUrl = resolvePublicMediaUrl(
                context.actor() != null ? context.actor().getAvatarUrl() : "");
        String windowLabel = context.body() != null ? context.body().replace(" · ", " • ") : "";

        Context ctx = new Context();
        ctx.setVariable("studentName", studentName);
        ctx.setVariable("actorName", actorName);
        ctx.setVariable("actorAvatarUrl", actorAvatarUrl);
        ctx.setVariable("examTitle", examTitle);
        ctx.setVariable("classroomName", classroomName);
        ctx.setVariable("windowLabel", windowLabel);
        ctx.setVariable("examUrl", examUrl);
        ctx.setVariable("brandName", brandName);
        ctx.setVariable("currentYear", Year.now().getValue());

        String htmlBody = templateEngine.process("mail/exam-assigned", ctx);
        String textBody = templateEngine.process("mail/exam-assigned.txt", ctx);

        return new RenderedMailMessage(recipient.email(), subjectLine, htmlBody, textBody);
    }

    @Override
    public RenderedMailMessage renderPasswordReset(String email, String recipientName, String resetUrl, int ttlMinutes) {
        String brandName = getBrandName();
        Context ctx = new Context();
        ctx.setVariable("recipientName", recipientName);
        ctx.setVariable("resetUrl", resetUrl);
        ctx.setVariable("ttlMinutes", ttlMinutes);
        ctx.setVariable("brandName", brandName);
        ctx.setVariable("currentYear", Year.now().getValue());

        String htmlBody = templateEngine.process("mail/password-reset", ctx);
        String textBody = templateEngine.process("mail/password-reset.txt", ctx);
        return new RenderedMailMessage(email, "Đặt lại mật khẩu — " + brandName, htmlBody, textBody);
    }

    @Override
    public RenderedMailMessage renderSessionReminder(SessionReminderNotifyContext context) {
        String brandName = getBrandName();
        String subjectLine = context.startingSoon()
                ? "[" + brandName + "] Buổi học trong ngày — " + safeTrim(context.classroomName())
                : "[" + brandName + "] Buổi học — " + safeTrim(context.classroomName());

        String timeRange = SessionReminderEmailServiceImpl.formatTime(context.startAt())
                + " – "
                + SessionReminderEmailServiceImpl.formatTime(context.endAt());
        String dateLabel = SessionReminderEmailServiceImpl.formatDate(context.startAt());
        String recipientName = safeTrim(context.recipientName());
        if (recipientName.isEmpty()) {
            recipientName = "bạn";
        }
        String teacherName = safeTrim(context.teacherName());
        if (teacherName.isEmpty()) {
            teacherName = "Giáo viên";
        }

        Context ctx = new Context();
        ctx.setVariable("teacherName", teacherName);
        ctx.setVariable("recipientName", recipientName);
        ctx.setVariable("classroomName", safeTrim(context.classroomName()));
        ctx.setVariable("sessionTitle", safeTrim(context.sessionTitle()));
        ctx.setVariable("lessonTitle", safeTrim(context.lessonTitle()));
        ctx.setVariable("timeRange", timeRange);
        ctx.setVariable("dateLabel", dateLabel);
        ctx.setVariable("meetLink", safeTrim(context.meetLink()));
        ctx.setVariable("scheduleUrl", context.scheduleUrl());
        ctx.setVariable("startingSoon", context.startingSoon());
        ctx.setVariable("brandName", brandName);
        ctx.setVariable("currentYear", Year.now().getValue());

        String htmlBody = templateEngine.process("mail/session-reminder", ctx);
        String textBody = templateEngine.process("mail/session-reminder.txt", ctx);
        return new RenderedMailMessage(context.teacherEmail(), subjectLine, htmlBody, textBody);
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }

    private String getBrandName() {
        String value = safeTrim(AppConstants.mailBrandName);
        return value.isEmpty() ? "Nova English" : value;
    }

    private String buildLessonUrl(String linkPath) {
        String base = normalizeBase(mailProperties.getFrontendBaseUrl());
        String path = linkPath != null && linkPath.startsWith("/") ? linkPath : "/" + linkPath;
        return base + path;
    }

    /** Rewrite /storage paths and localhost host to {@code app.mail.api-base-url}. */
    private String resolvePublicMediaUrl(String rawUrl) {
        String trimmed = safeTrim(rawUrl);
        if (trimmed.isEmpty()) {
            return "";
        }

        String apiBase = normalizeBase(mailProperties.getApiBaseUrl());

        if (trimmed.startsWith("/storage/")) {
            return apiBase + trimmed;
        }
        if (trimmed.startsWith("storage/")) {
            return apiBase + "/" + trimmed;
        }

        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed
                    .replace("http://localhost:7070", apiBase)
                    .replace("http://127.0.0.1:7070", apiBase)
                    .replace("https://localhost:7070", apiBase)
                    .replace("https://127.0.0.1:7070", apiBase);
        }

        return trimmed;
    }

    private String normalizeBase(String base) {
        if (base == null || base.isBlank()) {
            return "http://localhost:7070";
        }
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }
}
