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
    private Integer difficulty;
    private String cefrLevel;
    private String skill;
    private String topic;
    private String source;
    private Boolean aiGenerated;
}
