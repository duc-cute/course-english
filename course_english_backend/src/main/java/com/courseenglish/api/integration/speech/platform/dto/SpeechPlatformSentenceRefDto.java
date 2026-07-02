package com.courseenglish.api.integration.speech.platform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SpeechPlatformSentenceRefDto {

    @JsonProperty("sentenceIndex")
    private int sentenceIndex;

    @JsonProperty("startWordIndex")
    private int startWordIndex;

    @JsonProperty("endWordIndex")
    private int endWordIndex;
}
