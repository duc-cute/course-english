package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.ExamAssignmentStatusEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "exam_assignments")
@Getter
@Setter
public class ExamAssignment extends BaseObject {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exam_paper_id", nullable = false)
    private ExamPaper examPaper;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private User assignedBy;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    @Column(name = "open_at")
    private Instant openAt;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(name = "close_at")
    private Instant closeAt;

    @Column(name = "max_attempts", nullable = false)
    private int maxAttempts = 1;

    @Column(length = 512)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExamAssignmentStatusEnum status = ExamAssignmentStatusEnum.ACTIVE;

    @Transient
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID examPaperId;

    @Transient
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID classroomId;
}
