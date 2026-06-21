package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.SessionStatusEnum;
import com.courseenglish.api.util.constant.SessionTypeEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "class_sessions")
@Getter
@Setter
public class ClassSession extends BaseObject {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @Transient
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID classroomId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @Transient
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID teacherId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @Transient
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID lessonId;

    @NotBlank(message = "title is required")
    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = false, length = 32)
    private SessionTypeEnum sessionType = SessionTypeEnum.LIVE_CLASS;

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "end_at", nullable = false)
    private Instant endAt;

    @Column(name = "meet_link", columnDefinition = "TEXT")
    private String meetLink;

    @Column(name = "location_label", length = 128)
    private String locationLabel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SessionStatusEnum status = SessionStatusEnum.SCHEDULED;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "recurrence_group_id")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID recurrenceGroupId;

    @Column(name = "recurrence_rule", length = 64)
    private String recurrenceRule;
}
