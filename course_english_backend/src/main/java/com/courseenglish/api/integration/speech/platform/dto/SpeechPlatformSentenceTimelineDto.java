package com.courseenglish.api.integration.speech.platform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SpeechPlatformSentenceTimelineDto {

    @JsonProperty("sentenceIndex")
    private int sentenceIndex;

    private double start;
    private double end;
}
