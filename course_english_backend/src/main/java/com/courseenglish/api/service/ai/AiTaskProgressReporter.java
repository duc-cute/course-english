package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.AiTask;
import com.courseenglish.api.repository.AiTaskRepository;
import com.courseenglish.api.util.constant.AiTaskStatusEnum;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AiTaskProgressReporter {

  private static final long MIN_INTERVAL_MS = 400;

  private final AiTaskRepository aiTaskRepository;
  private final TransactionTemplate requiresNewTx;
  private final Map<UUID, Long> lastWriteMs = new ConcurrentHashMap<>();

  public AiTaskProgressReporter(AiTaskRepository aiTaskRepository, PlatformTransactionManager transactionManager) {
    this.aiTaskRepository = aiTaskRepository;
    this.requiresNewTx = new TransactionTemplate(transactionManager);
    this.requiresNewTx.setPropagationBehavior(TransactionTemplate.PROPAGATION_REQUIRES_NEW);
  }

  /** Throttled progress (stream chunks, batch hints). Never lowers percent or overwrites a higher milestone. */
  public void report(UUID taskId, String message, Integer percent) {
    reportInternal(taskId, message, percent, false);
  }

  /** Section boundaries and other milestones — always persisted, bypasses throttle. */
  public void reportMilestone(UUID taskId, String message, Integer percent) {
    reportInternal(taskId, message, percent, true);
  }

  /** Rough output size for a medium batch — used to scale stream % instead of jumping to cap. */
  private static final int STREAM_CHARS_REFERENCE = 8_000;

  public void reportStreamChars(UUID taskId, String phaseLabel, int streamChars, int percentCap) {
    if (taskId == null) {
      return;
    }
    String charsLabel = formatThousands(streamChars);
    int floor = 12;
    int span = Math.max(1, percentCap - floor);
    int scaled = floor + (int) Math.min(span, (streamChars * (long) span) / STREAM_CHARS_REFERENCE);
    report(taskId, phaseLabel + " — đã nhận " + charsLabel + " ký tự", Math.min(percentCap, scaled));
  }

  public void clear(UUID taskId) {
    if (taskId == null) {
      return;
    }
    lastWriteMs.remove(taskId);
    requiresNewTx.executeWithoutResult(
        status -> {
          AiTask task = aiTaskRepository.findById(taskId).orElse(null);
          if (task == null) {
            return;
          }
          task.setProgressMessage(null);
          task.setProgressPercent(null);
          aiTaskRepository.save(task);
        });
  }

  private void reportInternal(UUID taskId, String message, Integer percent, boolean milestone) {
    if (taskId == null || message == null || message.isBlank()) {
      return;
    }
    if (!milestone) {
      long now = System.currentTimeMillis();
      Long last = lastWriteMs.get(taskId);
      if (last != null && now - last < MIN_INTERVAL_MS) {
        return;
      }
      lastWriteMs.put(taskId, now);
    } else {
      lastWriteMs.put(taskId, System.currentTimeMillis());
    }
    persistProgress(taskId, message, percent, milestone);
  }

  private void persistProgress(UUID taskId, String message, Integer percent, boolean milestone) {
    requiresNewTx.executeWithoutResult(
        status -> {
          AiTask task = aiTaskRepository.findById(taskId).orElse(null);
          if (task == null || task.getStatus() != AiTaskStatusEnum.PROCESSING) {
            return;
          }
          int current = task.getProgressPercent() != null ? task.getProgressPercent() : 0;
          int next = percent != null ? clampPercent(percent) : current;

          if (!milestone && next < current) {
            return;
          }
          next = Math.max(current, next);

          task.setProgressMessage(message);
          task.setProgressPercent(next);
          aiTaskRepository.save(task);
        });
  }

  static int clampPercent(int percent) {
    return Math.min(100, Math.max(0, percent));
  }

  /**
   * Resolves stored percent for tests and persist logic.
   *
   * @return -1 when a non-milestone update should be skipped (would regress)
   */
  static int resolveNextPercent(int current, Integer proposed, boolean milestone) {
    if (proposed == null) {
      return current;
    }
    int next = clampPercent(proposed);
    if (!milestone && next < current) {
      return -1;
    }
    return Math.max(current, next);
  }

  private static String formatThousands(int value) {
    if (value >= 1_000) {
      return String.format(Locale.ROOT, "%.1fk", value / 1_000.0);
    }
    return String.valueOf(value);
  }
}
