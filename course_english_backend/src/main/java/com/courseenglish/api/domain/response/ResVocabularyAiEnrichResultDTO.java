package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResVocabularyAiEnrichResultDTO {
    private int phoneticFilled;
    private int phoneticSkipped;
    private int audioFilled;
    private int audioSkipped;
    private int audioFailed;
    private String message;
}
