package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ReqVocabularySetAssignmentDTO {

    @NotNull(message = "vocabularySetId is required")
    private UUID vocabularySetId;

    @NotNull(message = "classroomId is required")
    private UUID classroomId;

    private Instant dueAt;

    private String note;
}
