package com.courseenglish.api.domain.dto.story;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StorySentenceDTO {

    private int sentenceIndex;
    private int startWordIndex;
    private int endWordIndex;
    private String text;
    private String textVi;
}
