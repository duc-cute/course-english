package com.courseenglish.api.service.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class AiTaskWorker {

  private static final Logger log = LoggerFactory.getLogger(AiTaskWorker.class);

  private final AiTaskProcessingService aiTaskProcessingService;

  public AiTaskWorker(AiTaskProcessingService aiTaskProcessingService) {
    this.aiTaskProcessingService = aiTaskProcessingService;
  }

  @Async("aiTaskExecutor")
  public void processAsync(UUID taskId) {
    try {
      aiTaskProcessingService.processTask(taskId);
    } catch (Exception e) {
      log.error("[AiTaskWorker] Unhandled error taskId={}", taskId, e);
    }
  }
}
