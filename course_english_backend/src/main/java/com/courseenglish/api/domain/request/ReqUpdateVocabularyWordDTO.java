package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqUpdateVocabularyWordDTO {
    @NotBlank(message = "meaningVi is required")
    private String meaningVi;
}
