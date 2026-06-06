package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqSearchEnrollmentDTO extends ReqPagingSearchDTO {
    private String keyword;
    private UUID classroomId;
    private UUID studentId;
    private String status;
}
