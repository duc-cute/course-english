package com.courseenglish.api.integration.speech.model;

import lombok.Builder;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
public class SpeechResult {

    private final String provider;
    private final String voice;
    private final double duration;
    private final String audioUrl;
    @Builder.Default
    private final List<WordTimelineData> timeline = new ArrayList<>();
    @Builder.Default
    private final List<SentenceTimelineData> sentenceTimeline = new ArrayList<>();
}
