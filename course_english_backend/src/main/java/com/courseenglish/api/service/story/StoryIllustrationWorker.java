package com.courseenglish.api.service.story;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class StoryIllustrationWorker {

    private static final Logger log = LoggerFactory.getLogger(StoryIllustrationWorker.class);

    private final StoryIllustrationService storyIllustrationService;

    public StoryIllustrationWorker(@Lazy StoryIllustrationService storyIllustrationService) {
        this.storyIllustrationService = storyIllustrationService;
    }

    @Async("speechTaskExecutor")
    public void generateAsync(UUID storyId, UUID triggeredByUserId) {
        log.info(
                "[StoryIllustration] Async job started storyId={} userId={} thread={}",
                storyId,
                triggeredByUserId,
                Thread.currentThread().getName());
        try {
            storyIllustrationService.generateAndPersist(storyId, triggeredByUserId);
        } catch (Exception ex) {
            log.error(
                    "[StoryIllustration] Async uncaught storyId={} reason={}",
                    storyId,
                    ex.getMessage(),
                    ex);
        } finally {
            log.info("[StoryIllustration] Async job finished storyId={}", storyId);
        }
    }
}
