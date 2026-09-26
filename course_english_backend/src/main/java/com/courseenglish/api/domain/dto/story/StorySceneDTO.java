package com.courseenglish.api.domain.dto.story;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class StorySceneDTO {
    private UUID id;
    private int sceneIndex;
    private int sentenceStart;
    private int sentenceEnd;
    private String description;
    private String location;
    private List<String> characters = new ArrayList<>();
    private List<StorySceneSegmentDTO> segments = new ArrayList<>();
    private String imagePrompt;
    private String imageUrl;
    private String status;
}
