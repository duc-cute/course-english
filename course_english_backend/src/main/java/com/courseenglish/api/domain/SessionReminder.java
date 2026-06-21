package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.SessionReminderChannelEnum;
import com.courseenglish.api.util.constant.SessionReminderStatusEnum;
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
@Table(name = "session_reminders")
@Getter
@Setter
public class SessionReminder extends BaseObject {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "session_id", nullable = false, length = 36)
    private UUID sessionId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "teacher_id", nullable = false, length = 36)
    private UUID teacherId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private SessionReminderChannelEnum channel = SessionReminderChannelEnum.EMAIL;

    @Column(name = "remind_at", nullable = false)
    private Instant remindAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private SessionReminderStatusEnum status = SessionReminderStatusEnum.PENDING;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;
}
