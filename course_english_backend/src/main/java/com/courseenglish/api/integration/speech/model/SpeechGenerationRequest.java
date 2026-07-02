package com.courseenglish.api.integration.speech.model;

import lombok.Builder;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
public class SpeechGenerationRequest {

    private final String text;
    @Builder.Default
    private final List<String> tokens = new ArrayList<>();
    @Builder.Default
    private final List<SpeechSentenceRef> sentences = new ArrayList<>();
    private final String ttsProvider;
    private final String alignmentProvider;
    private final String voice;
    @Builder.Default
    private final double speed = 1.0;
    @Builder.Default
    private final double pitch = 0.0;
    @Builder.Default
    private final String format = "mp3";
}
