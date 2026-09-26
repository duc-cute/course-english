package com.courseenglish.api.domain.dto.story;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StorySceneSegmentDTO {
    /** narration | dialogue */
    private String type;
    private String speaker;
    private String text;
}
