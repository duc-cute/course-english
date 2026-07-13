package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResVocabularyPracticeAttemptBriefDTO {
    private UUID id;
    private UUID vocabularySetId;
    private UUID assignmentId;
    private int correctCount;
    private int totalCount;
    private int scorePercent;
    private boolean passed;
    private int passScorePercent;
    private Instant completedAt;
}
