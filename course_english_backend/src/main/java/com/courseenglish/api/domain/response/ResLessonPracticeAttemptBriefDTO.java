package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/** Điểm tóm tắt — không kèm answersSnapshot (dùng list / badge). */
@Getter
@Setter
public class ResLessonPracticeAttemptBriefDTO {
    private UUID id;
    private UUID lessonId;
    private int correctCount;
    private int totalCount;
    private int scorePercent;
    private boolean passed;
    private int passScorePercent;
    private Instant completedAt;
}
