package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.response.ResStoryAudioDTO;
import com.courseenglish.api.domain.response.ResStoryReaderPayloadDTO;

import com.courseenglish.api.util.error.IdInvalidException;

import java.util.UUID;

public interface StoryAudioService {

    ResStoryAudioDTO queueGeneration(UUID storyId) throws IdInvalidException;

    ResStoryAudioDTO getAudioStatus(UUID storyId) throws IdInvalidException;

    void generateAndPersist(UUID storyId, UUID triggeredByUserId);

    void attachAudioToReaderPayload(ResStoryReaderPayloadDTO dto, UUID storyId);

    void invalidateAudio(UUID storyId);
}
