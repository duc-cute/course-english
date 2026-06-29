package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqSearchExamPaperDTO extends ReqPagingSearchDTO {
    private String keyword;
    private String status;
    private UUID subjectId;
}
