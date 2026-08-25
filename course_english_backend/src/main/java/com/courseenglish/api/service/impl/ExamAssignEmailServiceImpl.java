package com.courseenglish.api.service.impl;

import com.courseenglish.api.config.MailProperties;
import com.courseenglish.api.domain.NotificationEmailLog;
import com.courseenglish.api.domain.dto.notification.ExamAssignedNotifyContext;
import com.courseenglish.api.domain.dto.notification.ExamAssignedNotifyContext.Recipient;
import com.courseenglish.api.repository.NotificationEmailLogRepository;
import com.courseenglish.api.service.ExamAssignEmailService;
import com.courseenglish.api.service.mail.MailSenderService;
import com.courseenglish.api.service.mail.MailTemplateService;
import com.courseenglish.api.service.mail.RenderedMailMessage;
import com.courseenglish.api.service.notification.ExamAssignedContextBuilder;
import com.courseenglish.api.util.AppConstants;
import com.courseenglish.api.util.constant.NotificationEmailStatusEnum;
import com.courseenglish.api.util.constant.NotificationTypeEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class ExamAssignEmailServiceImpl implements ExamAssignEmailService {

    private static final Logger log = LoggerFactory.getLogger(ExamAssignEmailServiceImpl.class);

    private final ExamAssignedContextBuilder contextBuilder;
    private final MailTemplateService mailTemplateService;
    private final MailSenderService mailSenderService;
    private final NotificationEmailLogRepository emailLogRepository;
    private final MailProperties mailProperties;

    public ExamAssignEmailServiceImpl(
            ExamAssignedContextBuilder contextBuilder,
            MailTemplateService mailTemplateService,
            MailSenderService mailSenderService,
            NotificationEmailLogRepository emailLogRepository,
            MailProperties mailProperties) {
        this.contextBuilder = contextBuilder;
        this.mailTemplateService = mailTemplateService;
        this.mailSenderService = mailSenderService;
        this.emailLogRepository = emailLogRepository;
        this.mailProperties = mailProperties;
    }

    @Override
    @Async("emailExecutor")
    public void sendExamAssignedEmailsAsync(UUID assignmentId, UUID actorUserId) {
        if (!AppConstants.notificationEmailEnabled) {
            log.debug("Skip exam assign email: NOTIFICATION_EMAIL_ENABLED is false");
            return;
        }
        if (!mailProperties.isConfigured()) {
            log.warn("Skip exam assign email: app.mail.enabled is false (set MAIL_ENABLED=true in .env)");
            return;
        }

        long started = System.currentTimeMillis();
        try {
            ExamAssignedNotifyContext ctx = contextBuilder.build(assignmentId, actorUserId).orElse(null);
            if (ctx == null) {
                return;
            }

            int sentCount = 0;
            int failedCount = 0;
            int skippedCount = 0;

            for (Recipient recipient : ctx.recipients()) {
                if (alreadySent(assignmentId, recipient.userId())) {
                    skippedCount++;
                    continue;
                }

                try {
                    RenderedMailMessage mail = mailTemplateService.renderExamAssigned(ctx, recipient);
                    mailSenderService.send(mail);
                    persistLog(assignmentId, recipient, NotificationEmailStatusEnum.SENT, null);
                    sentCount++;
                } catch (Exception ex) {
                    log.warn(
                            "Exam assign email failed: assignmentId={}, userId={}, email={}",
                            assignmentId,
                            recipient.userId(),
                            recipient.email(),
                            ex);
                    persistLog(assignmentId, recipient, NotificationEmailStatusEnum.FAILED, truncateError(ex));
                    failedCount++;
                }
            }

            log.info(
                    "Exam assign email done: assignmentId={}, sent={}, failed={}, skipped={}, ms={}",
                    assignmentId,
                    sentCount,
                    failedCount,
                    skippedCount,
                    System.currentTimeMillis() - started);
        } catch (Exception ex) {
            log.error("Exam assign email batch failed for assignment {}", assignmentId, ex);
        }
    }

    private boolean alreadySent(UUID assignmentId, UUID userId) {
        return emailLogRepository.existsByExamAssignmentIdAndUserIdAndTypeAndStatusAndVoidedFalse(
                assignmentId, userId, NotificationTypeEnum.EXAM_ASSIGNED, NotificationEmailStatusEnum.SENT);
    }

    @Transactional
    protected void persistLog(
            UUID assignmentId,
            Recipient recipient,
            NotificationEmailStatusEnum status,
            String errorMessage) {
        NotificationEmailLog row = new NotificationEmailLog();
        row.setExamAssignmentId(assignmentId);
        row.setUserId(recipient.userId());
        row.setEmail(recipient.email());
        row.setType(NotificationTypeEnum.EXAM_ASSIGNED);
        row.setStatus(status);
        row.setErrorMessage(errorMessage);
        if (status == NotificationEmailStatusEnum.SENT) {
            row.setSentAt(Instant.now());
        }
        try {
            emailLogRepository.save(row);
        } catch (Exception ex) {
            log.warn(
                    "Could not persist email log assignmentId={}, userId={}: {}",
                    assignmentId,
                    recipient.userId(),
                    ex.getMessage());
        }
    }

    private String truncateError(Exception ex) {
        String message = ex.getMessage();
        if (message == null || message.isBlank()) {
            message = ex.getClass().getSimpleName();
        }
        return message.length() > 2000 ? message.substring(0, 2000) : message;
    }
}
