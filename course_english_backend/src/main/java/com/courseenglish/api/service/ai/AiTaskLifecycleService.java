package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.AiTask;
import com.courseenglish.api.repository.AiTaskRepository;
import com.courseenglish.api.util.constant.AiTaskStatusEnum;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Short DB transactions for AI task state — AI work runs outside a long-lived transaction.
 */
@Service
public class AiTaskLifecycleService {

  private final AiTaskRepository aiTaskRepository;

  public AiTaskLifecycleService(AiTaskRepository aiTaskRepository) {
    this.aiTaskRepository = aiTaskRepository;
  }

  /** Atomically PENDING → PROCESSING. Returns false if another worker already claimed. */
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public boolean claimIfPending(UUID taskId, Instant startedAt) {
    int updated =
        aiTaskRepository.claimIfPending(
            taskId, startedAt, AiTaskStatusEnum.PENDING, AiTaskStatusEnum.PROCESSING);
    return updated == 1;
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void markDone(
      UUID taskId,
      String outputJson,
      String model,
      Integer promptTokens,
      Integer completionTokens) {
    AiTask task = aiTaskRepository.findById(taskId).orElse(null);
    if (task == null) {
      return;
    }
    task.setOutputJson(outputJson);
    task.setModel(model);
    task.setPromptTokens(promptTokens);
    task.setCompletionTokens(completionTokens);
    task.setStatus(AiTaskStatusEnum.DONE);
    task.setErrorMessage(null);
    task.setProgressMessage("Hoàn thành");
    task.setProgressPercent(100);
    task.setFinishedAt(Instant.now());
    aiTaskRepository.saveAndFlush(task);
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void markFailed(UUID taskId, String errorMessage) {
    AiTask task = aiTaskRepository.findById(taskId).orElse(null);
    if (task == null) {
      return;
    }
    task.setStatus(AiTaskStatusEnum.FAILED);
    task.setErrorMessage(errorMessage);
    task.setProgressMessage(null);
    task.setProgressPercent(null);
    task.setFinishedAt(Instant.now());
    aiTaskRepository.saveAndFlush(task);
  }
}
