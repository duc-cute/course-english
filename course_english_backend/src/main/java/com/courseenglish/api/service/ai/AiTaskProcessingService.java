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

import java.time.Instant;
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
  private final ObjectMapper objectMapper;

  public AiTaskProcessingService(
      AiTaskRepository aiTaskRepository,
      AiDocumentRepository aiDocumentRepository,
      AiQuestionGenerationService aiQuestionGenerationService,
      ActivityLogService activityLogService,
      ObjectMapper objectMapper) {
    this.aiTaskRepository = aiTaskRepository;
    this.aiDocumentRepository = aiDocumentRepository;
    this.aiQuestionGenerationService = aiQuestionGenerationService;
    this.activityLogService = activityLogService;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public void processTask(UUID taskId) {
    AiTask task = aiTaskRepository.findById(taskId).orElse(null);
    if (task == null || task.isVoided() || task.getStatus() != AiTaskStatusEnum.PENDING) {
      return;
    }

    task.setStatus(AiTaskStatusEnum.PROCESSING);
    task.setStartedAt(Instant.now());
    aiTaskRepository.save(task);

    try {
      ReqCreateQuestionGenTaskDTO input = objectMapper.readValue(task.getInputJson(), ReqCreateQuestionGenTaskDTO.class);
      AiDocument document = aiDocumentRepository.findById(task.getDocumentId()).orElse(null);
      if (document == null || document.getExtractedText() == null || document.getExtractedText().isBlank()) {
        throw new IllegalStateException("Tài liệu không có nội dung");
      }

      int difficulty = input.getDifficulty() != null ? input.getDifficulty() : 2;
      String promptLang = input.getPromptLang() != null ? input.getPromptLang() : "en";
      String promptPreview = truncateForLog(document.getExtractedText(), LOG_PROMPT_MAX_LEN);

      activityLogService.log(
          ActivityLogWriteContext.of(
                  ActivityLogSeverityEnum.INFO,
                  ActivityLogModuleEnum.AI,
                  ActivityLogActionEnum.AI_GEN_PROMPT,
                  "Đã gửi prompt sinh câu hỏi tới AI")
              .userId(task.getUserId())
              .ref("AI_TASK", task.getId())
              .detail(promptPreview)
              .put("taskId", task.getId())
              .put("documentId", task.getDocumentId())
              .put("questionCount", input.getQuestionCount())
              .put("questionTypes", input.getQuestionTypes())
              .put("difficulty", difficulty)
              .put("promptLang", promptLang)
              .put("promptChars", document.getExtractedText().length()));

      AiQuestionGenerationService.GenerationResult gen = aiQuestionGenerationService.generate(
          document.getExtractedText(),
          input.getQuestionCount(),
          input.getQuestionTypes(),
          difficulty,
          promptLang);

      String outputJson = objectMapper.writeValueAsString(gen.getEnvelope());
      task.setOutputJson(outputJson);
      task.setModel(gen.getModel());
      task.setPromptTokens(gen.getPromptTokens());
      task.setCompletionTokens(gen.getCompletionTokens());
      task.setStatus(AiTaskStatusEnum.DONE);
      task.setErrorMessage(null);
      task.setFinishedAt(Instant.now());
      aiTaskRepository.save(task);

      activityLogService.log(
          ActivityLogWriteContext.of(
                  ActivityLogSeverityEnum.INFO,
                  ActivityLogModuleEnum.AI,
                  ActivityLogActionEnum.AI_GEN_RESPONSE,
                  "Đã nhận phản hồi AI cho tác vụ sinh câu hỏi")
              .userId(task.getUserId())
              .ref("AI_TASK", task.getId())
              .detail(truncateForLog(outputJson, LOG_RESPONSE_MAX_LEN))
              .put("taskId", task.getId())
              .put("documentId", task.getDocumentId())
              .put("model", gen.getModel())
              .put("promptTokens", gen.getPromptTokens())
              .put("completionTokens", gen.getCompletionTokens())
              .put("responseChars", outputJson.length()));
    } catch (Exception e) {
      log.warn("[AiTaskProcessing] taskId={} failed: {}", taskId, e.getMessage());
      String errorMessage = e.getMessage() != null ? e.getMessage() : "Sinh câu hỏi thất bại";
      task.setStatus(AiTaskStatusEnum.FAILED);
      task.setErrorMessage(errorMessage);
      task.setFinishedAt(Instant.now());
      aiTaskRepository.save(task);

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
}
