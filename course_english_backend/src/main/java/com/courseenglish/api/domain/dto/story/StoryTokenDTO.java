package com.courseenglish.api.domain.dto.story;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class StoryTokenDTO {

    private String type;
    private String value;
    private String text;
    private Integer wordIndex;
    private UUID vocabularyId;
    private Boolean isVocab;
}
