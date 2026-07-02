package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqStoryWordEnrichDTO {

    @NotBlank(message = "word is required")
    private String word;

    private String contextSentence;
    private String level;
    private String partOfSpeech;
}
