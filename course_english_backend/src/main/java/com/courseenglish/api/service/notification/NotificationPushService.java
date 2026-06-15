package com.courseenglish.api.service.notification;

import com.courseenglish.api.domain.Notification;

import java.util.List;

public interface NotificationPushService {

    void pushCreated(Notification notification);

    void pushCreatedBatch(List<Notification> notifications);
}
