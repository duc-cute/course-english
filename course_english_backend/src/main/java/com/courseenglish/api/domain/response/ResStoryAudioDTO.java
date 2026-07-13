package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class ResStoryAudioDTO {

    private UUID storyId;
    private String processingStatus;
    private String voice;
    private String audioUrl;
    private BigDecimal duration;
    private boolean cached;
    private String message;
    /** Set when processingStatus is AUDIO_FAILED. */
    private String errorMessage;
}
