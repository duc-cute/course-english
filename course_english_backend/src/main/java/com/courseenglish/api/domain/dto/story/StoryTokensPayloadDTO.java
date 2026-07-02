package com.courseenglish.api.domain.dto.story;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class StoryTokensPayloadDTO {

    private List<StoryTokenDTO> tokens = new ArrayList<>();
    private List<StorySentenceDTO> sentences = new ArrayList<>();
}
