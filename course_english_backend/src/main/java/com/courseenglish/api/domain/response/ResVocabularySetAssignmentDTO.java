package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResVocabularySetAssignmentDTO {
    private UUID id;
    private UUID vocabularySetId;
    private String vocabularySetTitle;
    private String coverImageUrl;
    private String description;
    private Long itemCount;
    private UUID classroomId;
    private String classroomName;
    private UUID assignedById;
    private String teacherName;
    private Instant assignedAt;
    private Instant dueAt;
    private String note;
    private String status;
}
