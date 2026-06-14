package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.NotificationEmailStatusEnum;
import com.courseenglish.api.util.constant.NotificationTypeEnum;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification_email_logs")
@Getter
@Setter
public class NotificationEmailLog extends BaseObject {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "lesson_id", nullable = false, length = 36)
    private UUID lessonId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "user_id", nullable = false, length = 36)
    private UUID userId;

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private NotificationTypeEnum type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationEmailStatusEnum status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "sent_at")
    private Instant sentAt;
}
