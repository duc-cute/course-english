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

  public void report(UUID taskId, String message, Integer percent) {
    if (taskId == null || message == null || message.isBlank()) {
      return;
    }
    long now = System.currentTimeMillis();
    Long last = lastWriteMs.get(taskId);
    if (last != null && now - last < MIN_INTERVAL_MS) {
      return;
    }
    lastWriteMs.put(taskId, now);
    persist(taskId, message, percent);
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
    persist(taskId, null, null);
  }

  private void persist(UUID taskId, String message, Integer percent) {
    requiresNewTx.executeWithoutResult(status -> {
      AiTask task = aiTaskRepository.findById(taskId).orElse(null);
      if (task == null || task.getStatus() != AiTaskStatusEnum.PROCESSING) {
        return;
      }
      task.setProgressMessage(message);
      task.setProgressPercent(percent);
      aiTaskRepository.save(task);
    });
  }

  private static String formatThousands(int value) {
    if (value >= 1_000) {
      return String.format(Locale.ROOT, "%.1fk", value / 1_000.0);
    }
    return String.valueOf(value);
  }
}
