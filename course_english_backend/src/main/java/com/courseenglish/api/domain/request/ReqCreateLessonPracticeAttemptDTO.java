package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
public class ReqCreateLessonPracticeAttemptDTO {

    @NotNull(message = "lessonId is required")
    private UUID lessonId;

    @Min(0)
    private int correctCount;

    @Min(1)
    private int totalCount;

    @Min(0)
    private int scorePercent;

    private boolean passed;

    @Min(0)
    private int passScorePercent = 80;

    @Min(0)
    private long elapsedMs;

    private List<UUID> blockIds;

    /** questionId → { correct, selectedChoiceId?, matchingSelections? } */
    private Map<String, Object> answersSnapshot;
}
