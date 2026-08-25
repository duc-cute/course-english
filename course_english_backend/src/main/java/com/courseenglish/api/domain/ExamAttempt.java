package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.ExamAttemptStatusEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "exam_attempts")
@Getter
@Setter
public class ExamAttempt extends BaseObject {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private ExamAssignment assignment;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "exam_paper_id", nullable = false, length = 36)
    private UUID examPaperId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "user_id", nullable = false, length = 36)
    private UUID userId;

    @Column(name = "attempt_no", nullable = false)
    private int attemptNo = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExamAttemptStatusEnum status = ExamAttemptStatusEnum.IN_PROGRESS;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "elapsed_ms", nullable = false)
    private long elapsedMs;

    @Column(name = "correct_count")
    private Integer correctCount;

    @Column(name = "total_count")
    private Integer totalCount;

    @Column(name = "score_percent")
    private Integer scorePercent;

    @Column
    private Boolean passed;

    @Column(name = "pass_score_percent", nullable = false)
    private int passScorePercent = 80;

    @Column(name = "answers_json", columnDefinition = "JSON")
    private String answersJson;

    @Column(name = "sections_snapshot_json", columnDefinition = "JSON")
    private String sectionsSnapshotJson;
}
