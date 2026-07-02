package com.courseenglish.api.integration.speech.model;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SentenceTimelineData {

    private final int sentenceIndex;
    private final double start;
    private final double end;
}
