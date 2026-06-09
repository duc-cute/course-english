package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqLookupVocabularyWordDTO {
    @NotBlank(message = "wordEn is required")
    private String wordEn;
}
