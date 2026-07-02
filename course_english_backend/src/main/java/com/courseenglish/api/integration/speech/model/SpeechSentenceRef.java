package com.courseenglish.api.integration.speech.model;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SpeechSentenceRef {

    private final int sentenceIndex;
    private final int startWordIndex;
    private final int endWordIndex;
}
