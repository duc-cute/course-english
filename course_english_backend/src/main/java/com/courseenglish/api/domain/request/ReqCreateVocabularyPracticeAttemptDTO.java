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
public class ReqCreateVocabularyPracticeAttemptDTO {

    @NotNull(message = "vocabularySetId is required")
    private UUID vocabularySetId;

    /** Optional — set when practicing from an Assigned card. */
    private UUID assignmentId;

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

    private Map<String, Object> answersSnapshot;
}
