package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResStudentSupportOverdueLessonDTO {
    private UUID lessonId;
    private String title;
    private Instant dueAt;
}
