package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.QuestionTypeEnum;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqExamSectionDTO {
    private UUID id;
    private String title;
    private String instruction;
    private QuestionTypeEnum questionType;
    private Integer displayOrder;

    @NotBlank(message = "payloadJson is required")
    private String payloadJson;
}
