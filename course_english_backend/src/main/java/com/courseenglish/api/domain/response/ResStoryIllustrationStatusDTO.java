package com.courseenglish.api.domain.response;

import com.courseenglish.api.domain.dto.story.StoryCharacterProfileDTO;
import com.courseenglish.api.domain.dto.story.StorySceneDTO;
import com.courseenglish.api.domain.dto.story.StoryVisualProfileDTO;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResStoryIllustrationStatusDTO {
    private UUID storyId;
    private String illustrationStatus;
    private String errorMessage;
    private StoryVisualProfileDTO visualProfile;
    private List<StoryCharacterProfileDTO> characters = new ArrayList<>();
    private List<StorySceneDTO> scenes = new ArrayList<>();
    private String message;
}
