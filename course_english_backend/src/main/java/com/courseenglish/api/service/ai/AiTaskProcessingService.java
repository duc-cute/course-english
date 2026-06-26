package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.AiDocument;
import com.courseenglish.api.domain.AiTask;
import com.courseenglish.api.domain.request.ReqCreateQuestionGenTaskDTO;
import com.courseenglish.api.repository.AiDocumentRepository;
import com.courseenglish.api.repository.AiTaskRepository;
import com.courseenglish.api.service.ActivityLogService;
import com.courseenglish.api.service.activitylog.ActivityLogWriteContext;
import com.courseenglish.api.util.constant.ActivityLogActionEnum;
import com.courseenglish.api.util.constant.ActivityLogModuleEnum;
import com.courseenglish.api.util.constant.ActivityLogSeverityEnum;
import com.courseenglish.api.util.constant.AiTaskStatusEnum;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
public class AiTaskProcessingService {

  private static final Logger log = LoggerFactory.getLogger(AiTaskProcessingService.class);
  private static final int LOG_PROMPT_MAX_LEN = 1200;
  private static final int LOG_RESPONSE_MAX_LEN = 1500;

  private final AiTaskRepository aiTaskRepository;
  private final AiDocumentRepository aiDocumentRepository;
  private final AiQuestionGenerationService aiQuestionGenerationService;
  private final ActivityLogService activityLogService;
  private final AiTaskProgressReporter progressReporter;
  private final ObjectMapper objectMapper;

  public AiTaskProcessingService(
      AiTaskRepository aiTaskRepository,
      AiDocumentRepository aiDocumentRepository,
      AiQuestionGenerationService aiQuestionGenerationService,
      ActivityLogService activityLogService,
      AiTaskProgressReporter progressReporter,
      ObjectMapper objectMapper) {
    this.aiTaskRepository = aiTaskRepository;
    this.aiDocumentRepository = aiDocumentRepository;
    this.aiQuestionGenerationService = aiQuestionGenerationService;
    this.activityLogService = activityLogService;
    this.progressReporter = progressReporter;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public void processTask(UUID taskId) {
    AiTask task = aiTaskRepository.findById(taskId).orElse(null);
    if (task == null) {
      log.warn("[AiTaskProcessing] skip taskId={} reason=not_found", taskId);
      logWorkerSkip(taskId, null, "task_not_found");
      return;
    }
    if (task.isVoided()) {
      log.warn("[AiTaskProcessing] skip taskId={} reason=voided", taskId);
      logWorkerSkip(taskId, task, "voided");
      return;
    }
    if (task.getStatus() != AiTaskStatusEnum.PENDING) {
      log.warn("[AiTaskProcessing] skip taskId={} reason=status={}", taskId, task.getStatus());
      logWorkerSkip(taskId, task, "status_" + task.getStatus().name());
      return;
    }

    task.setStatus(AiTaskStatusEnum.PROCESSING);
    Instant workerStartedAt = Instant.now();
    task.setStartedAt(workerStartedAt);
    task.setProgressMessage("Đang chuẩn bị sinh câu…");
    task.setProgressPercent(0);
    aiTaskRepository.save(task);
    progressReporter.report(task.getId(), "Đang chuẩn bị sinh câu…", 0);

    long taskWallStartMs = System.currentTimeMillis();

    try {
      ReqCreateQuestionGenTaskDTO input = objectMapper.readValue(task.getInputJson(), ReqCreateQuestionGenTaskDTO.class);
      AiDocument document = aiDocumentRepository.findById(task.getDocumentId()).orElse(null);
      if (document == null || document.getExtractedText() == null || document.getExtractedText().isBlank()) {
        throw new IllegalStateException("Tài liệu không có nội dung");
      }

      progressReporter.report(task.getId(), "Đang phân tích tài liệu…", 5);

      int difficulty = input.getDifficulty() != null ? input.getDifficulty() : 2;
      String promptLang = input.getPromptLang() != null ? input.getPromptLang() : "en";

      Long queueWaitMs = null;
      if (task.getCreatedAt() != null) {
        queueWaitMs = Duration.between(task.getCreatedAt(), workerStartedAt).toMillis();
      }

      String documentSource = resolveDocumentSource(document);
      int documentTextChars = document.getExtractedText().length();
      int estimatedDocTokens = Math.max(1, documentTextChars / 4);

      activityLogService.log(
          ActivityLogWriteContext.of(
                  ActivityLogSeverityEnum.INFO,
                  ActivityLogModuleEnum.AI,
                  ActivityLogActionEnum.AI_GEN_START,
                  "Worker start [" + documentSource + "] | doc " + formatThousands(documentTextChars) + " chars (~"
                      + formatThousands(estimatedDocTokens) + " tok)"
                      + (queueWaitMs != null && queueWaitMs > 0
                          ? " | queue " + formatDuration(queueWaitMs.intValue())
                          : ""))
              .userId(task.getUserId())
              .ref("AI_TASK", task.getId())
              .put("taskId", task.getId())
              .put("documentId", task.getDocumentId())
              .put("step", "worker_start")
              .put("documentSource", documentSource)
              .put("queueWaitMs", queueWaitMs)
              .put("documentTextChars", documentTextChars)
              .put("estimatedDocumentTokens", estimatedDocTokens)
              .put("documentStatus", document.getStatus() != null ? document.getStatus().name() : null)
              .put("mimeType", document.getMimeType())
              .put("questionCount", input.getQuestionCount())
              .put("questionTypes", input.getQuestionTypes()));

      AiGenTraceContext trace =
          new AiGenTraceContext(task.getId(), task.getUserId(), task.getDocumentId(), documentSource);

      progressReporter.report(task.getId(), "Đang tạo ngân hàng câu hỏi…", 10);

      AiQuestionGenerationService.GenerationResult gen = aiQuestionGenerationService.generate(
          document.getExtractedText(),
          input.getQuestionCount(),
          input.getQuestionTypes(),
          difficulty,
          promptLang,
          trace);

      String outputJson = objectMapper.writeValueAsString(gen.getEnvelope());
      task.setOutputJson(outputJson);
      task.setModel(gen.getModel());
      task.setPromptTokens(gen.getPromptTokens());
      task.setCompletionTokens(gen.getCompletionTokens());
      task.setStatus(AiTaskStatusEnum.DONE);
      task.setErrorMessage(null);
      task.setProgressMessage("Hoàn thành");
      task.setProgressPercent(100);
      task.setFinishedAt(Instant.now());
      aiTaskRepository.save(task);

      long totalTaskMs = System.currentTimeMillis() - taskWallStartMs;

      activityLogService.log(
          ActivityLogWriteContext.of(
                  ActivityLogSeverityEnum.INFO,
                  ActivityLogModuleEnum.AI,
                  ActivityLogActionEnum.AI_GEN_RESPONSE,
                  "Hoàn thành sinh câu — tổng " + totalTaskMs + "ms (OpenRouter " + trace.getOpenRouterTotalMs() + "ms)")
              .userId(task.getUserId())
              .ref("AI_TASK", task.getId())
              .detail(truncateForLog(outputJson, LOG_RESPONSE_MAX_LEN))
              .put("taskId", task.getId())
              .put("documentId", task.getDocumentId())
              .put("documentSource", documentSource)
              .put("step", "task_done")
              .put("totalTaskMs", totalTaskMs)
              .put("openRouterTotalMs", trace.getOpenRouterTotalMs())
              .put("openRouterAttempts", trace.getOpenRouterAttempts())
              .put("model", gen.getModel())
              .put("promptTokens", gen.getPromptTokens())
              .put("completionTokens", gen.getCompletionTokens())
              .put("responseChars", outputJson.length())
              .put("questionCount", input.getQuestionCount()));
    } catch (Exception e) {
      log.warn("[AiTaskProcessing] taskId={} failed: {}", taskId, e.getMessage());
      String errorMessage = e.getMessage() != null ? e.getMessage() : "Sinh câu hỏi thất bại";
      task.setStatus(AiTaskStatusEnum.FAILED);
      task.setErrorMessage(errorMessage);
      task.setProgressMessage(null);
      task.setProgressPercent(null);
      task.setFinishedAt(Instant.now());
      aiTaskRepository.save(task);
      progressReporter.clear(task.getId());

      ActivityLogActionEnum action = resolveAiFailureAction(errorMessage);
      activityLogService.log(
          ActivityLogWriteContext.of(ActivityLogSeverityEnum.ERROR, ActivityLogModuleEnum.AI, action, errorMessage)
              .userId(task.getUserId())
              .ref("AI_TASK", task.getId())
              .detail(stackSummary(e))
              .put("taskId", task.getId())
              .put("documentId", task.getDocumentId())
              .put("taskType", task.getTaskType() != null ? task.getTaskType().name() : null));
    }
  }

  private void logWorkerSkip(UUID taskId, AiTask task, String reason) {
    ActivityLogWriteContext ctx =
        ActivityLogWriteContext.of(
                ActivityLogSeverityEnum.WARN,
                ActivityLogModuleEnum.AI,
                ActivityLogActionEnum.AI_GEN_SKIP,
                "Worker bỏ qua tác vụ — " + reason)
            .ref("AI_TASK", taskId)
            .put("taskId", taskId)
            .put("step", "worker_skip")
            .put("reason", reason);
    if (task != null) {
      ctx.userId(task.getUserId()).put("documentId", task.getDocumentId());
      if (task.getStatus() != null) {
        ctx.put("taskStatus", task.getStatus().name());
      }
    }
    activityLogService.log(ctx);
  }

  private ActivityLogActionEnum resolveAiFailureAction(String message) {
    String normalized = message == null ? "" : message.toLowerCase();
    if (normalized.contains("openrouter") || normalized.contains("không gọi được openrouter")) {
      return ActivityLogActionEnum.AI_OR_ERROR;
    }
    if (normalized.contains("json")) {
      return ActivityLogActionEnum.AI_JSON_INVALID;
    }
    if (normalized.contains("gián đoạn") || normalized.contains("timeout") || normalized.contains("quá lâu")) {
      return ActivityLogActionEnum.AI_OR_TIMEOUT;
    }
    return ActivityLogActionEnum.AI_GEN_FAILED;
  }

  private String stackSummary(Throwable e) {
    if (e == null) {
      return null;
    }
    StringBuilder sb = new StringBuilder();
    sb.append(e.getClass().getSimpleName());
    if (e.getMessage() != null && !e.getMessage().isBlank()) {
      sb.append(": ").append(e.getMessage());
    }
    StackTraceElement[] stack = e.getStackTrace();
    if (stack != null && stack.length > 0) {
      sb.append("\n at ").append(stack[0]);
    }
    return sb.toString();
  }

  private String truncateForLog(String text, int maxLen) {
    if (text == null) {
      return null;
    }
    String normalized = text.trim();
    if (normalized.length() <= maxLen) {
      return normalized;
    }
    return normalized.substring(0, maxLen) + "...(truncated)";
  }

  private static String formatThousands(int value) {
    if (value >= 1_000_000) {
      return String.format(Locale.ROOT, "%.1fM", value / 1_000_000.0);
    }
    if (value >= 1_000) {
      return String.format(Locale.ROOT, "%.1fk", value / 1_000.0);
    }
    return String.valueOf(value);
  }

  private static String formatDuration(int durationMs) {
    if (durationMs >= 60_000) {
      return String.format(Locale.ROOT, "%.1f phút", durationMs / 60_000.0);
    }
    if (durationMs >= 1_000) {
      return String.format(Locale.ROOT, "%.1fs", durationMs / 1_000.0);
    }
    return durationMs + "ms";
  }

  private static String resolveDocumentSource(AiDocument document) {
    if (document.getMimeType() != null && document.getMimeType().toLowerCase(Locale.ROOT).contains("text/plain")) {
      return "paste";
    }
    String storageFileName = document.getStorageFileName();
    if (storageFileName != null && storageFileName.startsWith("paste-")) {
      return "paste";
    }
    return "upload";
  }
}
