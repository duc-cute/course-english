package com.courseenglish.api.service.story;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

/** Chạy nền enrich glossary (IPA + audio) sau khi story đã commit. */
@Component
public class StoryGlossaryEnrichWorker {

    private static final Logger log = LoggerFactory.getLogger(StoryGlossaryEnrichWorker.class);

    private final StoryGlossaryEnrichService enrichService;

    public StoryGlossaryEnrichWorker(StoryGlossaryEnrichService enrichService) {
        this.enrichService = enrichService;
    }

    /** Gọi trong transaction: job chỉ bắt đầu sau commit (tránh đọc story chưa ghi). */
    public void enqueueAfterCommit(UUID storyId) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    enrichAsync(storyId);
                }
            });
        } else {
            enrichAsync(storyId);
        }
    }

    @Async("speechTaskExecutor")
    public void enrichAsync(UUID storyId) {
        log.info("[StoryGlossary] Async enrich started storyId={} thread={}", storyId, Thread.currentThread().getName());
        try {
            enrichService.enrichStory(storyId);
        } catch (Exception ex) {
            log.error("[StoryGlossary] Async enrich uncaught error storyId={} reason={}", storyId, ex.getMessage(), ex);
        }
    }
}
