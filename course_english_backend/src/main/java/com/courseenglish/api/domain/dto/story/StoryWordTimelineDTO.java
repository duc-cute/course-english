package com.courseenglish.api.domain.dto.story;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StoryWordTimelineDTO {

    private int wordIndex;
    private String word;
    private double start;
    private double end;
    private Integer charStart;
    private Integer charEnd;
}
