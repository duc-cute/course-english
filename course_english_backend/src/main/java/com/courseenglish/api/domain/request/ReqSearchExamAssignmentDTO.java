package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqSearchExamAssignmentDTO {
    private Integer page;
    private Integer size;
    private String sort;
    private String keyword;
    private String status;
    private UUID classroomId;
    private UUID examPaperId;
}
