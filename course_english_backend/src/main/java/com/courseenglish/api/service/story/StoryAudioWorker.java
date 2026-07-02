package com.courseenglish.api.service.story;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class StoryAudioWorker {

    private final StoryAudioService storyAudioService;

    public StoryAudioWorker(StoryAudioService storyAudioService) {
        this.storyAudioService = storyAudioService;
    }

    @Async("speechTaskExecutor")
    public void generateAsync(UUID storyId) {
        storyAudioService.generateAndPersist(storyId);
    }
}
