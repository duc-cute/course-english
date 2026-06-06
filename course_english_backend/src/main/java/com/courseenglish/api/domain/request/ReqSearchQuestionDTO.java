package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqSearchQuestionDTO extends ReqPagingSearchDTO {
    private String keyword;
    private UUID categoryId;
    private String questionType;
    private String status;
}
