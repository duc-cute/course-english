package com.courseenglish.api.service.impl;

import com.courseenglish.api.config.MailProperties;
import com.courseenglish.api.domain.NotificationEmailLog;
import com.courseenglish.api.domain.dto.notification.LessonPublishedNotifyContext;
import com.courseenglish.api.domain.dto.notification.LessonPublishedNotifyContext.Recipient;
import com.courseenglish.api.repository.NotificationEmailLogRepository;
import com.courseenglish.api.service.LessonPublishEmailService;
import com.courseenglish.api.service.mail.MailSenderService;
import com.courseenglish.api.service.mail.MailTemplateService;
import com.courseenglish.api.service.mail.RenderedMailMessage;
import com.courseenglish.api.service.notification.LessonPublishedContextBuilder;
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
public class LessonPublishEmailServiceImpl implements LessonPublishEmailService {

    private static final Logger log = LoggerFactory.getLogger(LessonPublishEmailServiceImpl.class);

    private final LessonPublishedContextBuilder contextBuilder;
    private final MailTemplateService mailTemplateService;
    private final MailSenderService mailSenderService;
    private final NotificationEmailLogRepository emailLogRepository;
    private final MailProperties mailProperties;

    public LessonPublishEmailServiceImpl(
            LessonPublishedContextBuilder contextBuilder,
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
    public void sendLessonPublishedEmailsAsync(UUID lessonId, UUID actorUserId) {
        if (!AppConstants.notificationEmailEnabled) {
            log.debug("Skip lesson publish email: NOTIFICATION_EMAIL_ENABLED is false");
            return;
        }
        if (!mailProperties.isConfigured()) {
            log.warn("Skip lesson publish email: app.mail.enabled is false (set MAIL_ENABLED=true in .env)");
            return;
        }

        long started = System.currentTimeMillis();
        try {
            LessonPublishedNotifyContext ctx = contextBuilder.build(lessonId, actorUserId).orElse(null);
            if (ctx == null) {
                return;
            }

            int sentCount = 0;
            int failedCount = 0;
            int skippedCount = 0;

            for (Recipient recipient : ctx.recipients()) {
                if (alreadySent(lessonId, recipient.userId())) {
                    skippedCount++;
                    continue;
                }

                try {
                    RenderedMailMessage mail = mailTemplateService.renderLessonPublished(ctx, recipient);
                    mailSenderService.send(mail);
                    persistLog(lessonId, recipient, NotificationEmailStatusEnum.SENT, null);
                    sentCount++;
                } catch (Exception ex) {
                    log.warn(
                            "Lesson publish email failed: lessonId={}, userId={}, email={}",
                            lessonId,
                            recipient.userId(),
                            recipient.email(),
                            ex);
                    persistLog(lessonId, recipient, NotificationEmailStatusEnum.FAILED, truncateError(ex));
                    failedCount++;
                }
            }

            log.info(
                    "Lesson publish email done: lessonId={}, sent={}, failed={}, skipped={}, ms={}",
                    lessonId,
                    sentCount,
                    failedCount,
                    skippedCount,
                    System.currentTimeMillis() - started);
        } catch (Exception ex) {
            log.error("Lesson publish email batch failed for lesson {}", lessonId, ex);
        }
    }

    private boolean alreadySent(UUID lessonId, UUID userId) {
        return emailLogRepository.existsByLessonIdAndUserIdAndTypeAndStatusAndVoidedFalse(
                lessonId, userId, NotificationTypeEnum.LESSON_PUBLISHED, NotificationEmailStatusEnum.SENT);
    }

    @Transactional
    protected void persistLog(
            UUID lessonId,
            Recipient recipient,
            NotificationEmailStatusEnum status,
            String errorMessage) {
        NotificationEmailLog row = new NotificationEmailLog();
        row.setLessonId(lessonId);
        row.setUserId(recipient.userId());
        row.setEmail(recipient.email());
        row.setType(NotificationTypeEnum.LESSON_PUBLISHED);
        row.setStatus(status);
        row.setErrorMessage(errorMessage);
        if (status == NotificationEmailStatusEnum.SENT) {
            row.setSentAt(Instant.now());
        }
        try {
            emailLogRepository.save(row);
        } catch (Exception ex) {
            log.warn(
                    "Could not persist email log lessonId={}, userId={}: {}",
                    lessonId,
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
