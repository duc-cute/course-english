package com.courseenglish.api.integration.speech.platform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class SpeechPlatformTtsRequestDto {

    private String text;
    private List<String> tokens = new ArrayList<>();
    private List<SpeechPlatformSentenceRefDto> sentences = new ArrayList<>();
    private String provider;
    @JsonProperty("alignmentProvider")
    private String alignmentProvider;
    private String voice;
    private double speed = 1.0;
    private double pitch = 0.0;
    private String format = "mp3";
}
