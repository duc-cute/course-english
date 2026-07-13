package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResVocabularyPracticeSummaryItemDTO {
    private UUID vocabularySetId;
    private ResVocabularyPracticeAttemptBriefDTO latest;
    private ResVocabularyPracticeAttemptBriefDTO best;
    private int attemptCount;
}
