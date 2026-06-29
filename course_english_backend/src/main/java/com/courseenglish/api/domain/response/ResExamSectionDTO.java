package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.QuestionTypeEnum;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResExamSectionDTO {
    private UUID id;
    private UUID examPaperId;
    private int displayOrder;
    private String title;
    private String instruction;
    private QuestionTypeEnum questionType;
    private String payloadJson;
    private int questionCount;
    private Instant createdAt;
    private Instant updatedAt;
}
