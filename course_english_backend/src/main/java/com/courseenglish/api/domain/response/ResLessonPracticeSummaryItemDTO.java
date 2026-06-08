package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResLessonPracticeSummaryItemDTO {
    private UUID lessonId;
    private ResLessonPracticeAttemptBriefDTO latest;
    private ResLessonPracticeAttemptBriefDTO best;
    private int attemptCount;
}
