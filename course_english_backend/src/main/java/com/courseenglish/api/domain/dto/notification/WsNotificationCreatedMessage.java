package com.courseenglish.api.domain.dto.notification;

import com.courseenglish.api.domain.response.ResNotificationDTO;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WsNotificationCreatedMessage {

    private String type = "NOTIFICATION_CREATED";
    private ResNotificationDTO notification;
    private long unreadCount;

    public WsNotificationCreatedMessage() {}

    public WsNotificationCreatedMessage(ResNotificationDTO notification, long unreadCount) {
        this.notification = notification;
        this.unreadCount = unreadCount;
    }
}
