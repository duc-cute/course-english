package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqQuestionChoiceDTO {
    @NotBlank(message = "choiceKey is required")
    private String choiceKey;

    @NotBlank(message = "choiceText is required")
    private String choiceText;

    private Boolean correct;
    private Integer displayOrder;
}
