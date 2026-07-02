package com.courseenglish.api.domain.dto.story;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StorySentenceTimelineDTO {

    private int sentenceIndex;
    private double start;
    private double end;
}
