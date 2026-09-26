package com.courseenglish.api.domain.response;

import com.courseenglish.api.domain.dto.story.StoryCharacterProfileDTO;
import com.courseenglish.api.domain.dto.story.StoryGlossaryEntryDTO;
import com.courseenglish.api.domain.dto.story.StorySceneDTO;
import com.courseenglish.api.domain.dto.story.StorySentenceDTO;
import com.courseenglish.api.domain.dto.story.StorySentenceTimelineDTO;
import com.courseenglish.api.domain.dto.story.StoryTokenDTO;
import com.courseenglish.api.domain.dto.story.StoryVisualProfileDTO;
import com.courseenglish.api.domain.dto.story.StoryWordTimelineDTO;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResStoryReaderPayloadDTO {

    private UUID id;
    private String title;
    private String slug;
    private String level;
    private Integer readingTimeMinutes;
    private UUID vocabularySetId;
    private String processingStatus;
    private String illustrationStatus;
    private String storyFormat;
    private String visualStyle;
    private String titleVi;
    private List<StoryTokenDTO> tokens;
    private List<StorySentenceDTO> sentences;
    private List<StoryGlossaryEntryDTO> glossary = new ArrayList<>();
    private List<StorySceneDTO> scenes = new ArrayList<>();
    private List<StoryCharacterProfileDTO> characters = new ArrayList<>();
    private StoryVisualProfileDTO visualProfile;

    private String audioUrl;
    private String voice;
    private BigDecimal duration;
    private List<StoryWordTimelineDTO> wordTimeline = new ArrayList<>();
    private List<StorySentenceTimelineDTO> sentenceTimeline = new ArrayList<>();
}
