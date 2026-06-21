package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResStudentSupportLessonProgressDTO {
    private UUID lessonId;
    private String title;
    private String slug;
    private Instant dueAt;
    private Integer bestScorePercent;
    private Boolean passed;
    private Instant completedAt;
}
