package com.courseenglish.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "lesson_practice_attempts")
@Getter
@Setter
public class LessonPracticeAttempt extends BaseObject {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "user_id", nullable = false, length = 36)
    private UUID userId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "lesson_id", nullable = false, length = 36)
    private UUID lessonId;

    @Column(name = "correct_count", nullable = false)
    private int correctCount;

    @Column(name = "total_count", nullable = false)
    private int totalCount;

    @Column(name = "score_percent", nullable = false)
    private int scorePercent;

    @Column(nullable = false)
    private boolean passed;

    @Column(name = "pass_score_percent", nullable = false)
    private int passScorePercent = 80;

    @Column(name = "elapsed_ms", nullable = false)
    private long elapsedMs;

    @Column(name = "block_ids_json", columnDefinition = "JSON")
    private String blockIdsJson;

    @Column(name = "answers_snapshot_json", columnDefinition = "JSON")
    private String answersSnapshotJson;

    @Column(name = "completed_at", nullable = false)
    private Instant completedAt;
}
