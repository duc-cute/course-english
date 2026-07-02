package com.courseenglish.api.integration.speech.platform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SpeechPlatformWordTimelineDto {

    @JsonProperty("wordIndex")
    private int wordIndex;

    private String word;
    private double start;
    private double end;

    @JsonProperty("charStart")
    private Integer charStart;

    @JsonProperty("charEnd")
    private Integer charEnd;
}
