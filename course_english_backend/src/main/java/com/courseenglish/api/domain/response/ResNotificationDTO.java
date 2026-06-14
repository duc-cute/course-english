package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.NotificationTypeEnum;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
public class ResNotificationDTO {
    private UUID id;
    private NotificationTypeEnum type;
    private String title;
    private String body;
    private String linkPath;
    private boolean read;
    private Instant readAt;
    private Instant createdAt;
    private Map<String, Object> payload;
}
