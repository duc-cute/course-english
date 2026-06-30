package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqVocabularyItemDTO {
    private String wordEn;
    private String meaningVi;
    private String phonetic;
    private String partOfSpeech;
    private String exampleSentence;
    private Integer displayOrder;
}
