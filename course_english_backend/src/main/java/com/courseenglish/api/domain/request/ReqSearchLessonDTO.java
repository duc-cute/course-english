package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqSearchLessonDTO extends ReqPagingSearchDTO {
    private String keyword;
    private UUID subjectId;
    private String status;
}
