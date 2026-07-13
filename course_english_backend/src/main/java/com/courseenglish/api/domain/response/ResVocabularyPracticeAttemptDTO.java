package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
public class ResVocabularyPracticeAttemptDTO {
    private UUID id;
    private UUID userId;
    private UUID vocabularySetId;
    private UUID assignmentId;
    private int correctCount;
    private int totalCount;
    private int scorePercent;
    private boolean passed;
    private int passScorePercent;
    private long elapsedMs;
    private List<UUID> blockIds;
    private Map<String, Object> answersSnapshot;
    private Instant completedAt;
    private Instant createdAt;
}
