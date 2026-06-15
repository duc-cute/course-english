package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Notification;
import com.courseenglish.api.domain.dto.notification.LessonPublishedNotifyContext;
import com.courseenglish.api.repository.NotificationRepository;
import com.courseenglish.api.service.LessonNotificationService;
import com.courseenglish.api.service.notification.LessonPublishedContextBuilder;
import com.courseenglish.api.service.notification.NotificationPushService;
import com.courseenglish.api.util.constant.NotificationTypeEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class LessonNotificationServiceImpl implements LessonNotificationService {

    private static final Logger log = LoggerFactory.getLogger(LessonNotificationServiceImpl.class);
    private static final int BATCH_SIZE = 100;

    private final LessonPublishedContextBuilder contextBuilder;
    private final NotificationRepository notificationRepository;
    private final NotificationPushService notificationPushService;

    public LessonNotificationServiceImpl(
            LessonPublishedContextBuilder contextBuilder,
            NotificationRepository notificationRepository,
            NotificationPushService notificationPushService) {
        this.contextBuilder = contextBuilder;
        this.notificationRepository = notificationRepository;
        this.notificationPushService = notificationPushService;
    }

    @Override
    @Async("notificationExecutor")
    @Transactional
    public void notifyLessonPublishedAsync(UUID lessonId, UUID actorUserId) {
        long started = System.currentTimeMillis();
        try {
            LessonPublishedNotifyContext ctx = contextBuilder.build(lessonId, actorUserId).orElse(null);
            if (ctx == null) {
                return;
            }

            List<Notification> batch = new ArrayList<>(BATCH_SIZE);
            List<Notification> savedRows = new ArrayList<>(ctx.recipients().size());
            int recipientCount = 0;

            for (LessonPublishedNotifyContext.Recipient recipient : ctx.recipients()) {
                Notification row = new Notification();
                row.setUserId(recipient.userId());
                row.setType(NotificationTypeEnum.LESSON_PUBLISHED);
                row.setTitle(ctx.title());
                row.setBody(ctx.body());
                row.setLinkPath(ctx.linkPath());
                row.setPayloadJson(ctx.payloadJson());
                batch.add(row);
                recipientCount++;

                if (batch.size() >= BATCH_SIZE) {
                    savedRows.addAll(notificationRepository.saveAll(batch));
                    batch.clear();
                }
            }

            if (!batch.isEmpty()) {
                savedRows.addAll(notificationRepository.saveAll(batch));
            }

            notificationRepository.flush();
            notificationPushService.pushCreatedBatch(savedRows);

            log.info(
                    "Lesson publish in-app notify done: lessonId={}, recipients={}, ms={}",
                    lessonId,
                    recipientCount,
                    System.currentTimeMillis() - started);
        } catch (Exception ex) {
            log.error("Lesson publish in-app notify failed for lesson {}", lessonId, ex);
        }
    }
}
