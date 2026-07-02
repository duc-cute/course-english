package com.courseenglish.api.integration.speech.model;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class WordTimelineData {

    private final int wordIndex;
    private final String word;
    private final double start;
    private final double end;
    private final Integer charStart;
    private final Integer charEnd;
}
