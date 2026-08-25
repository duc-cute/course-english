package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Notification;
import com.courseenglish.api.domain.dto.notification.ExamAssignedNotifyContext;
import com.courseenglish.api.repository.NotificationRepository;
import com.courseenglish.api.service.ExamAssignmentNotificationService;
import com.courseenglish.api.service.notification.ExamAssignedContextBuilder;
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
public class ExamAssignmentNotificationServiceImpl implements ExamAssignmentNotificationService {

    private static final Logger log = LoggerFactory.getLogger(ExamAssignmentNotificationServiceImpl.class);
    private static final int BATCH_SIZE = 100;

    private final ExamAssignedContextBuilder contextBuilder;
    private final NotificationRepository notificationRepository;
    private final NotificationPushService notificationPushService;

    public ExamAssignmentNotificationServiceImpl(
            ExamAssignedContextBuilder contextBuilder,
            NotificationRepository notificationRepository,
            NotificationPushService notificationPushService) {
        this.contextBuilder = contextBuilder;
        this.notificationRepository = notificationRepository;
        this.notificationPushService = notificationPushService;
    }

    @Override
    @Async("notificationExecutor")
    @Transactional
    public void notifyExamAssignedAsync(UUID assignmentId, UUID actorUserId) {
        long started = System.currentTimeMillis();
        try {
            ExamAssignedNotifyContext ctx = contextBuilder.build(assignmentId, actorUserId).orElse(null);
            if (ctx == null) {
                return;
            }

            List<Notification> batch = new ArrayList<>(BATCH_SIZE);
            List<Notification> savedRows = new ArrayList<>(ctx.recipients().size());
            int recipientCount = 0;

            for (ExamAssignedNotifyContext.Recipient recipient : ctx.recipients()) {
                Notification row = new Notification();
                row.setUserId(recipient.userId());
                row.setType(NotificationTypeEnum.EXAM_ASSIGNED);
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
                    "Exam assign in-app notify done: assignmentId={}, recipients={}, ms={}",
                    assignmentId,
                    recipientCount,
                    System.currentTimeMillis() - started);
        } catch (Exception ex) {
            log.error("Exam assign in-app notify failed for assignment {}", assignmentId, ex);
        }
    }
}
