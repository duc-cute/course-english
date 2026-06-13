package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResLessonReadingProgressDTO {
    private UUID id;
    private UUID userId;
    private UUID lessonId;
    private String lastBlockId;
    private int scrollPercent;
    private String lastTab;
    private String lessonTitle;
    private String subjectName;
    private String lessonSlug;
    private String coverImageUrl;
    private Instant updatedAt;
}
