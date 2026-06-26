package com.courseenglish.api.service.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.RejectedExecutionException;

@Component
public class AiTaskWorker {

  private static final Logger log = LoggerFactory.getLogger(AiTaskWorker.class);

  private final AiTaskProcessingService aiTaskProcessingService;

  public AiTaskWorker(AiTaskProcessingService aiTaskProcessingService) {
    this.aiTaskProcessingService = aiTaskProcessingService;
  }

  @Async("aiTaskExecutor")
  public void processAsync(UUID taskId) {
    log.info("[AiTaskWorker] dispatch taskId={}", taskId);
    try {
      aiTaskProcessingService.processTask(taskId);
    } catch (Exception e) {
      log.error("[AiTaskWorker] Unhandled error taskId={}", taskId, e);
    }
  }

  /** Queue async work without failing the HTTP caller when the pool is saturated. */
  public void dispatchSafely(UUID taskId) {
    try {
      processAsync(taskId);
    } catch (RejectedExecutionException e) {
      log.warn("[AiTaskWorker] dispatch rejected taskId={}: {}", taskId, e.getMessage());
    } catch (Exception e) {
      log.warn("[AiTaskWorker] dispatch failed taskId={}", taskId, e);
    }
  }
}
