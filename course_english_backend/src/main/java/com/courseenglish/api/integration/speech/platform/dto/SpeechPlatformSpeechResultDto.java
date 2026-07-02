package com.courseenglish.api.integration.speech.platform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class SpeechPlatformSpeechResultDto {

    private String provider;
    private String voice;
    private double duration;

    @JsonProperty("audioUrl")
    private String audioUrl;

    private List<SpeechPlatformWordTimelineDto> timeline = new ArrayList<>();

    @JsonProperty("sentenceTimeline")
    private List<SpeechPlatformSentenceTimelineDto> sentenceTimeline = new ArrayList<>();
}
