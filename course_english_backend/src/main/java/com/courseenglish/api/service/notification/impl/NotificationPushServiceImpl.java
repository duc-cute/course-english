package com.courseenglish.api.service.notification.impl;

import com.courseenglish.api.domain.Notification;
import com.courseenglish.api.domain.dto.notification.WsNotificationCreatedMessage;
import com.courseenglish.api.repository.NotificationRepository;
import com.courseenglish.api.service.notification.NotificationMapper;
import com.courseenglish.api.service.notification.NotificationPushService;
import com.courseenglish.api.service.notification.ws.NotificationSessionRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationPushServiceImpl implements NotificationPushService {

    private static final Logger log = LoggerFactory.getLogger(NotificationPushServiceImpl.class);
    private static final String USER_QUEUE = "/queue/notifications";

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final NotificationSessionRegistry sessionRegistry;

    public NotificationPushServiceImpl(
            SimpMessagingTemplate messagingTemplate,
            NotificationRepository notificationRepository,
            NotificationMapper notificationMapper,
            NotificationSessionRegistry sessionRegistry) {
        this.messagingTemplate = messagingTemplate;
        this.notificationRepository = notificationRepository;
        this.notificationMapper = notificationMapper;
        this.sessionRegistry = sessionRegistry;
    }

    @Override
    public void pushCreated(Notification notification) {
        if (notification == null || notification.getUserId() == null || notification.getId() == null) {
            return;
        }
        UUID userId = notification.getUserId();
        if (!sessionRegistry.isOnline(userId)) {
            return;
        }

        try {
            long unreadCount = notificationRepository.countByUserIdAndReadAtIsNullAndVoidedFalse(userId);
            WsNotificationCreatedMessage message = new WsNotificationCreatedMessage(
                    notificationMapper.toDto(notification), unreadCount);
            messagingTemplate.convertAndSendToUser(userId.toString(), USER_QUEUE, message);
            log.debug("WS notification pushed: userId={}, notificationId={}", userId, notification.getId());
        } catch (Exception ex) {
            log.warn(
                    "WS notification push failed: userId={}, notificationId={}",
                    userId,
                    notification.getId(),
                    ex);
        }
    }

    @Override
    public void pushCreatedBatch(List<Notification> notifications) {
        if (notifications == null || notifications.isEmpty()) {
            return;
        }
        for (Notification notification : notifications) {
            pushCreated(notification);
        }
    }
}
