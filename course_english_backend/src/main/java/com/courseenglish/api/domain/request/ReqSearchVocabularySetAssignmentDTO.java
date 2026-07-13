package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqSearchVocabularySetAssignmentDTO {
    private String keyword;
    private UUID classroomId;
    private UUID vocabularySetId;
    private String status;
    private Integer page = 0;
    private Integer size = 20;
    private String sort = "assignedAt,desc";
}
