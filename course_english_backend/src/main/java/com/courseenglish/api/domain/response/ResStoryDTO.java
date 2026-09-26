package com.courseenglish.api.domain.response;

import com.courseenglish.api.domain.dto.story.StorySentenceDTO;
import com.courseenglish.api.domain.dto.story.StoryTokenDTO;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResStoryDTO {

    private UUID id;
    private String title;
    private String slug;
    private String content;
    private String level;
    private Integer readingTimeMinutes;
    private String prompt;
    private String coverImageUrl;
    private UUID vocabularySetId;
    private String vocabularySetTitle;
    private String status;
    private String processingStatus;
    private boolean aiGenerated;
    private String voiceProfileJson;
    private String storyFormat;
    private String visualStyle;
    /** Độ dài file audio (giây), null nếu chưa AUDIO_READY. */
    private BigDecimal duration;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
}
