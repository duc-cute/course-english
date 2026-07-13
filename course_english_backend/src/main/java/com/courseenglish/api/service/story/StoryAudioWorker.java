package com.courseenglish.api.service.story;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class StoryAudioWorker {

    private static final Logger log = LoggerFactory.getLogger(StoryAudioWorker.class);

    private final StoryAudioService storyAudioService;

    public StoryAudioWorker(StoryAudioService storyAudioService) {
        this.storyAudioService = storyAudioService;
    }

    @Async("speechTaskExecutor")
    public void generateAsync(UUID storyId, UUID triggeredByUserId) {
        log.info(
                "[StoryAudio] Async job started storyId={} userId={} thread={}",
                storyId,
                triggeredByUserId,
                Thread.currentThread().getName());
        try {
            storyAudioService.generateAndPersist(storyId, triggeredByUserId);
        } catch (Exception ex) {
            log.error("[StoryAudio] Async job uncaught error storyId={} reason={}", storyId, ex.getMessage(), ex);
        } finally {
            log.info("[StoryAudio] Async job finished storyId={}", storyId);
        }
    }
}
