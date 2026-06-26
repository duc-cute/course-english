package com.courseenglish.api.service.ai;

import com.courseenglish.api.service.ai.question.AiQuestionBatchPlanner;
import com.courseenglish.api.service.ai.question.AiQuestionBatchPlanner.BatchSpec;
import com.courseenglish.api.service.ai.question.AiQuestionGenResultValidator;
import com.courseenglish.api.service.ai.question.AiQuestionPromptAssembler;
import com.courseenglish.api.service.ai.question.dto.AiDraftQuestionDTO;
import com.courseenglish.api.service.ai.question.dto.AiQuestionGenEnvelopeDTO;
import com.courseenglish.api.service.ai.question.dto.AiQuestionGenMetaDTO;
import com.courseenglish.api.service.ActivityLogService;
import com.courseenglish.api.service.activitylog.ActivityLogWriteContext;
import com.courseenglish.api.service.impl.OpenRouterClient;
import com.courseenglish.api.util.constant.ActivityLogActionEnum;
import com.courseenglish.api.util.constant.ActivityLogModuleEnum;
import com.courseenglish.api.util.constant.ActivityLogSeverityEnum;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class AiQuestionGenerationService {

  private static final int LOG_PROMPT_MAX_LEN = 1200;

  private final OpenRouterClient openRouterClient;
  private final ObjectMapper objectMapper;
  private final AiQuestionPromptAssembler promptAssembler;
  private final AiQuestionGenResultValidator resultValidator;
  private final ActivityLogService activityLogService;
  private final AiTaskProgressReporter progressReporter;
  private final AiQuestionBatchPlanner batchPlanner;
  private final Executor aiOpenRouterExecutor;

  @Value("${app.ai.question-gen-model:anthropic/claude-3.5-sonnet}")
  private String questionGenModel;

  @Value("${app.ai.question-gen-timeout-sec:180}")
  private long questionGenTimeoutSec;

  @Value("${app.ai.question-gen-stream-enabled:true}")
  private boolean streamEnabled;

  @Value("${app.ai.question-gen-batch-enabled:true}")
  private boolean batchEnabled;

  @Value("${app.ai.question-gen-batch-min-questions:10}")
  private int batchMinQuestions;

  @Value("${app.ai.question-gen-batch-max-concurrent:2}")
  private int batchMaxConcurrent;

  public AiQuestionGenerationService(
      OpenRouterClient openRouterClient,
      ObjectMapper objectMapper,
      AiQuestionPromptAssembler promptAssembler,
      AiQuestionGenResultValidator resultValidator,
      ActivityLogService activityLogService,
      AiTaskProgressReporter progressReporter,
      AiQuestionBatchPlanner batchPlanner,
      @Qualifier("aiOpenRouterExecutor") Executor aiOpenRouterExecutor) {
    this.openRouterClient = openRouterClient;
    this.objectMapper = objectMapper;
    this.promptAssembler = promptAssembler;
    this.resultValidator = resultValidator;
    this.activityLogService = activityLogService;
    this.progressReporter = progressReporter;
    this.batchPlanner = batchPlanner;
    this.aiOpenRouterExecutor = aiOpenRouterExecutor;
  }

  public GenerationResult generate(
      String documentExcerpt,
      int questionCount,
      List<QuestionTypeEnum> questionTypes,
      int difficulty,
      String promptLang) throws IdInvalidException {
    return generate(documentExcerpt, questionCount, questionTypes, difficulty, promptLang, null);
  }

  public GenerationResult generate(
      String documentExcerpt,
      int questionCount,
      List<QuestionTypeEnum> questionTypes,
      int difficulty,
      String promptLang,
      AiGenTraceContext trace) throws IdInvalidException {
    if (shouldUseParallelBatch(questionCount, questionTypes)) {
      return generateParallelBatched(
          documentExcerpt, questionCount, questionTypes, difficulty, promptLang, trace);
    }
    return generateSingleShot(
        documentExcerpt, questionCount, questionTypes, difficulty, promptLang, trace, streamEnabled);
  }

  private boolean shouldUseParallelBatch(int questionCount, List<QuestionTypeEnum> questionTypes) {
    return batchEnabled
        && questionTypes != null
        && questionTypes.size() >= 2
        && questionCount >= batchMinQuestions;
  }

  private GenerationResult generateSingleShot(
      String documentExcerpt,
      int questionCount,
      List<QuestionTypeEnum> questionTypes,
      int difficulty,
      String promptLang,
      AiGenTraceContext trace,
      boolean useStream) throws IdInvalidException {
    String system = promptAssembler.buildSystemPrompt(questionTypes);
    String user = promptAssembler.buildUserPrompt(
        documentExcerpt, questionCount, questionTypes, difficulty, promptLang);

    List<Map<String, String>> messages = List.of(
        Map.of("role", "system", "content", system),
        Map.of("role", "user", "content", user));

    logPromptAssembled(trace, documentExcerpt, system, user, questionCount, questionTypes, "single_shot");

    OpenRouterClient.ChatResult chatResult = callWithJsonRetry(messages, trace, useStream);
    return buildGenerationResult(
        chatResult, questionTypes, questionCount, difficulty, promptLang, "single_shot", null);
  }

  private GenerationResult generateParallelBatched(
      String documentExcerpt,
      int questionCount,
      List<QuestionTypeEnum> questionTypes,
      int difficulty,
      String promptLang,
      AiGenTraceContext trace) throws IdInvalidException {
    List<BatchSpec> specs = batchPlanner.plan(questionCount, questionTypes);
    if (specs.isEmpty()) {
      throw new IdInvalidException("Không thể chia batch sinh câu hỏi");
    }

    String typeSummary =
        specs.stream().map(s -> s.type().name() + "×" + s.count()).collect(Collectors.joining(", "));
    if (trace != null) {
      activityLogService.log(
          ActivityLogWriteContext.of(
                  ActivityLogSeverityEnum.INFO,
                  ActivityLogModuleEnum.AI,
                  ActivityLogActionEnum.AI_GEN_PROMPT,
                  "Parallel batch: " + specs.size() + " nhóm (" + typeSummary + ")")
              .userId(trace.getUserId())
              .ref("AI_TASK", trace.getTaskId())
              .put("taskId", trace.getTaskId())
              .put("documentId", trace.getDocumentId())
              .put("step", "batch_plan")
              .put("batchCount", specs.size())
              .put("questionCount", questionCount)
              .put("questionTypes", questionTypes));
      progressReporter.report(
          trace.getTaskId(),
          "Sinh song song " + specs.size() + " nhóm (" + typeSummary + ")…",
          8);
    }

    int maxConcurrent = Math.max(1, Math.min(batchMaxConcurrent, specs.size()));
    Semaphore semaphore = new Semaphore(maxConcurrent);
    AtomicInteger completedBatches = new AtomicInteger(0);
    List<CompletableFuture<BatchOutcome>> futures = new ArrayList<>();

    for (int i = 0; i < specs.size(); i++) {
      final BatchSpec spec = specs.get(i);
      final int batchIndex = i;
      futures.add(
          CompletableFuture.supplyAsync(
              () -> {
                try {
                  semaphore.acquire();
                  return runBatch(
                      documentExcerpt,
                      spec,
                      difficulty,
                      promptLang,
                      trace,
                      batchIndex,
                      specs.size());
                } catch (InterruptedException e) {
                  Thread.currentThread().interrupt();
                  return BatchOutcome.failed(spec, "Bị gián đoạn");
                } finally {
                  semaphore.release();
                  if (trace != null) {
                    int done = completedBatches.incrementAndGet();
                    int percent = 10 + (int) ((done * 80.0) / specs.size());
                    progressReporter.report(
                        trace.getTaskId(),
                        "Hoàn thành nhóm " + done + "/" + specs.size() + " (" + spec.type().name() + ")",
                        percent);
                  }
                }
              },
              aiOpenRouterExecutor));
    }

    CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();

    List<AiDraftQuestionDTO> mergedQuestions = new ArrayList<>();
    int totalPromptTokens = 0;
    int totalCompletionTokens = 0;
    int batchesSucceeded = 0;
    List<String> batchErrors = new ArrayList<>();

    for (CompletableFuture<BatchOutcome> future : futures) {
      BatchOutcome outcome = future.join();
      if (outcome.error() != null) {
        batchErrors.add(outcome.type().name() + ": " + outcome.error());
        continue;
      }
      batchesSucceeded++;
      if (outcome.promptTokens() != null) {
        totalPromptTokens += outcome.promptTokens();
      }
      if (outcome.completionTokens() != null) {
        totalCompletionTokens += outcome.completionTokens();
      }
      if (outcome.questions() != null) {
        mergedQuestions.addAll(outcome.questions());
      }
    }

    if (batchesSucceeded == 0) {
      String detail =
          batchErrors.isEmpty() ? "Tất cả batch thất bại" : String.join("; ", batchErrors);
      throw new IdInvalidException("Sinh câu hỏi thất bại — " + detail);
    }

    AiQuestionGenEnvelopeDTO envelope = new AiQuestionGenEnvelopeDTO();
    envelope.setSchemaVersion(1);
    envelope.setQuestions(mergedQuestions);
    envelope.setMeta(new AiQuestionGenMetaDTO());
    envelope.getMeta().setModel(questionGenModel);
    envelope.getMeta().setRequestedTypes(questionTypes);
    envelope.getMeta().setRequestedCount(questionCount);
    envelope.getMeta().setGenerationMode("parallel_batch");
    envelope.getMeta().setBatchCount(specs.size());

    resultValidator.normalizeAndValidate(envelope, promptLang, difficulty);
    applyMetaCounts(envelope, questionCount);

    if (!batchErrors.isEmpty() && trace != null) {
      activityLogService.log(
          ActivityLogWriteContext.of(
                  ActivityLogSeverityEnum.WARN,
                  ActivityLogModuleEnum.AI,
                  ActivityLogActionEnum.AI_GEN_RESPONSE,
                  "Một số batch lỗi: " + String.join("; ", batchErrors))
              .userId(trace.getUserId())
              .ref("AI_TASK", trace.getTaskId())
              .put("taskId", trace.getTaskId())
              .put("batchErrors", batchErrors));
    }

    GenerationResult result = new GenerationResult();
    result.setEnvelope(envelope);
    result.setPromptTokens(totalPromptTokens > 0 ? totalPromptTokens : null);
    result.setCompletionTokens(totalCompletionTokens > 0 ? totalCompletionTokens : null);
    result.setModel(questionGenModel);
    return result;
  }

  private BatchOutcome runBatch(
      String documentExcerpt,
      BatchSpec spec,
      int difficulty,
      String promptLang,
      AiGenTraceContext trace,
      int batchIndex,
      int totalBatches) {
    try {
      if (trace != null) {
        int startPercent = 12 + (batchIndex * 65 / Math.max(1, totalBatches));
        progressReporter.report(
            trace.getTaskId(),
            "Đang sinh " + spec.type().name() + " (" + spec.count() + " câu)…",
            startPercent);
      }

      String system = promptAssembler.buildSystemPromptForType(spec.type());
      String user = promptAssembler.buildUserPrompt(
          documentExcerpt, spec.count(), List.of(spec.type()), difficulty, promptLang);
      List<Map<String, String>> messages = List.of(
          Map.of("role", "system", "content", system),
          Map.of("role", "user", "content", user));

      if (trace != null) {
        logPromptAssembled(
            trace,
            documentExcerpt,
            system,
            user,
            spec.count(),
            List.of(spec.type()),
            "batch_" + (batchIndex + 1) + "_of_" + totalBatches);
      }

      OpenRouterClient.ChatResult chatResult = callWithJsonRetry(messages, trace, false);
      AiQuestionGenEnvelopeDTO envelope = parseEnvelope(chatResult.getContent());
      List<AiDraftQuestionDTO> questions =
          envelope.getQuestions() != null ? envelope.getQuestions() : new ArrayList<>();

      AiQuestionGenEnvelopeDTO batchEnvelope = new AiQuestionGenEnvelopeDTO();
      batchEnvelope.setQuestions(questions);
      resultValidator.normalizeAndValidate(batchEnvelope, promptLang, difficulty);

      return BatchOutcome.success(
          spec.type(),
          spec.count(),
          batchEnvelope.getQuestions(),
          chatResult.getPromptTokens(),
          chatResult.getCompletionTokens());
    } catch (Exception e) {
      return BatchOutcome.failed(spec.type(), e.getMessage() != null ? e.getMessage() : "Lỗi batch");
    }
  }

  private GenerationResult buildGenerationResult(
      OpenRouterClient.ChatResult chatResult,
      List<QuestionTypeEnum> questionTypes,
      int questionCount,
      int difficulty,
      String promptLang,
      String generationMode,
      Integer batchCount) throws IdInvalidException {
    AiQuestionGenEnvelopeDTO envelope = parseEnvelope(chatResult.getContent());

    if (envelope.getMeta() == null) {
      envelope.setMeta(new AiQuestionGenMetaDTO());
    }
    envelope.getMeta().setModel(questionGenModel);
    envelope.getMeta().setRequestedTypes(questionTypes);
    envelope.getMeta().setRequestedCount(questionCount);
    envelope.getMeta().setGenerationMode(generationMode);
    envelope.getMeta().setBatchCount(batchCount);
    if (envelope.getQuestions() == null) {
      envelope.setQuestions(new ArrayList<>());
    }

    resultValidator.normalizeAndValidate(envelope, promptLang, difficulty);
    applyMetaCounts(envelope, questionCount);

    GenerationResult result = new GenerationResult();
    result.setEnvelope(envelope);
    result.setPromptTokens(chatResult.getPromptTokens());
    result.setCompletionTokens(chatResult.getCompletionTokens());
    result.setModel(questionGenModel);
    return result;
  }

  private void applyMetaCounts(AiQuestionGenEnvelopeDTO envelope, int requestedCount) {
    if (envelope.getMeta() == null) {
      envelope.setMeta(new AiQuestionGenMetaDTO());
    }
    int total = envelope.getQuestions() != null ? envelope.getQuestions().size() : 0;
    int valid = resultValidator.countValid(envelope.getQuestions());
    int invalid = total - valid;
    envelope.getMeta().setRequestedCount(requestedCount);
    envelope.getMeta().setValidCount(valid);
    envelope.getMeta().setInvalidCount(invalid);
    if (invalid > 0 || total < requestedCount) {
      envelope
          .getMeta()
          .setSummaryMessage(
              "Đã sinh " + valid + "/" + requestedCount + " câu hợp lệ"
                  + (invalid > 0 ? " (" + invalid + " câu lỗi định dạng)" : ""));
    }
  }

  private void logPromptAssembled(
      AiGenTraceContext trace,
      String documentExcerpt,
      String system,
      String user,
      int questionCount,
      List<QuestionTypeEnum> questionTypes,
      String mode) {
    if (trace == null) {
      return;
    }
    int systemChars = system.length();
    int userChars = user.length();
    int totalPromptChars = systemChars + userChars;
    int estimatedInputTokens = Math.max(1, totalPromptChars / 4);
    activityLogService.log(
        ActivityLogWriteContext.of(
                ActivityLogSeverityEnum.INFO,
                ActivityLogModuleEnum.AI,
                ActivityLogActionEnum.AI_GEN_PROMPT,
                formatPromptMetricsMessage(
                    trace.getDocumentSource(),
                    systemChars,
                    userChars,
                    totalPromptChars,
                    estimatedInputTokens,
                    questionCount))
            .userId(trace.getUserId())
            .ref("AI_TASK", trace.getTaskId())
            .detail(truncateForLog(user, LOG_PROMPT_MAX_LEN))
            .put("taskId", trace.getTaskId())
            .put("documentId", trace.getDocumentId())
            .put("documentSource", trace.getDocumentSource())
            .put("step", "prompt_assembled")
            .put("generationMode", mode)
            .put("model", questionGenModel)
            .put("documentChars", documentExcerpt.length())
            .put("userPromptChars", userChars)
            .put("systemPromptChars", systemChars)
            .put("totalPromptChars", totalPromptChars)
            .put("estimatedInputTokens", estimatedInputTokens)
            .put("messageCount", 2)
            .put("questionCount", questionCount)
            .put("questionTypes", questionTypes));
    progressReporter.report(trace.getTaskId(), "Đang sinh câu hỏi…", 5);
  }

  private OpenRouterClient.ChatResult callWithJsonRetry(
      List<Map<String, String>> messages, AiGenTraceContext trace, boolean useStream)
      throws IdInvalidException {
    OpenRouterClient.ChatResult first = callOpenRouter(messages, trace, 1, useStream);
    try {
      parseEnvelope(first.getContent());
      return first;
    } catch (IdInvalidException parseError) {
      List<Map<String, String>> retryMessages = new ArrayList<>(messages);
      retryMessages.add(Map.of("role", "assistant", "content", first.getContent()));
      retryMessages.add(
          Map.of(
              "role",
              "user",
              "content",
              "Invalid JSON. Return ONLY the corrected JSON envelope. No markdown."));
      return callOpenRouter(retryMessages, trace, 2, useStream);
    }
  }

  private OpenRouterClient.ChatResult callOpenRouter(
      List<Map<String, String>> messages,
      AiGenTraceContext trace,
      int attempt,
      boolean useStream)
      throws IdInvalidException {
    if (trace != null) {
      int requestPayloadChars = sumMessageChars(messages);
      activityLogService.log(
          ActivityLogWriteContext.of(
                  ActivityLogSeverityEnum.INFO,
                  ActivityLogModuleEnum.AI,
                  ActivityLogActionEnum.AI_OR_ROUND,
                  "Gửi OpenRouter lần "
                      + attempt
                      + " — payload "
                      + formatThousands(requestPayloadChars)
                      + " chars (~"
                      + Math.max(1, requestPayloadChars / 4)
                      + " tokens ước tính)")
              .userId(trace.getUserId())
              .ref("AI_TASK", trace.getTaskId())
              .put("taskId", trace.getTaskId())
              .put("documentId", trace.getDocumentId())
              .put("documentSource", trace.getDocumentSource())
              .put("step", "openrouter_request")
              .put("attempt", attempt)
              .put("model", questionGenModel)
              .put("timeoutSec", questionGenTimeoutSec)
              .put("stream", useStream)
              .put("requestPayloadChars", requestPayloadChars)
              .put("estimatedInputTokens", Math.max(1, requestPayloadChars / 4))
              .put("messageCount", messages.size()));
    }

    OpenRouterClient.ChatResult result;
    if (useStream) {
      UUID taskId = trace != null ? trace.getTaskId() : null;
      AtomicInteger streamChars = new AtomicInteger(0);
      result =
          openRouterClient.chatJsonStream(
              questionGenModel,
              messages,
              questionGenTimeoutSec,
              null,
              new OpenRouterClient.StreamHandler() {
                @Override
                public void onChunk(String delta) {
                  if (taskId == null || delta == null || delta.isEmpty()) {
                    return;
                  }
                  int chars = streamChars.addAndGet(delta.length());
                  progressReporter.reportStreamChars(taskId, "Đang sinh câu hỏi", chars, 95);
                }

                @Override
                public void onComplete(OpenRouterClient.ChatResult completed) {
                  // result returned from chatJsonStream
                }
              });
    } else {
      result = openRouterClient.chatJson(questionGenModel, messages, questionGenTimeoutSec, null);
    }

    int durationMs = result.getDurationMs() != null ? result.getDurationMs() : 0;
    if (trace != null) {
      trace.addOpenRouterRound(durationMs);
      int promptTokens = result.getPromptTokens() != null ? result.getPromptTokens() : 0;
      int completionTokens = result.getCompletionTokens() != null ? result.getCompletionTokens() : 0;
      int responseChars = result.getContent() != null ? result.getContent().length() : 0;
      activityLogService.log(
          ActivityLogWriteContext.of(
                  ActivityLogSeverityEnum.INFO,
                  ActivityLogModuleEnum.AI,
                  ActivityLogActionEnum.AI_OR_ROUND,
                  "OpenRouter lần "
                      + attempt
                      + ": "
                      + formatDuration(durationMs)
                      + " | input "
                      + formatThousands(promptTokens)
                      + " tok"
                      + " | output "
                      + formatThousands(completionTokens)
                      + " tok"
                      + " | response "
                      + formatThousands(responseChars)
                      + " chars")
              .userId(trace.getUserId())
              .ref("AI_TASK", trace.getTaskId())
              .put("taskId", trace.getTaskId())
              .put("documentId", trace.getDocumentId())
              .put("documentSource", trace.getDocumentSource())
              .put("step", "openrouter_response")
              .put("attempt", attempt)
              .put("durationMs", durationMs)
              .put("model", questionGenModel)
              .put("stream", useStream)
              .put("promptTokens", promptTokens)
              .put("completionTokens", completionTokens)
              .put("responseChars", responseChars));
    }
    return result;
  }

  private record BatchOutcome(
      QuestionTypeEnum type,
      int requestedCount,
      List<AiDraftQuestionDTO> questions,
      Integer promptTokens,
      Integer completionTokens,
      String error) {

    static BatchOutcome success(
        QuestionTypeEnum type,
        int requestedCount,
        List<AiDraftQuestionDTO> questions,
        Integer promptTokens,
        Integer completionTokens) {
      return new BatchOutcome(type, requestedCount, questions, promptTokens, completionTokens, null);
    }

    static BatchOutcome failed(BatchSpec spec, String error) {
      return new BatchOutcome(spec.type(), spec.count(), List.of(), null, null, error);
    }

    static BatchOutcome failed(QuestionTypeEnum type, String error) {
      return new BatchOutcome(type, 0, List.of(), null, null, error);
    }
  }

  private static String formatPromptMetricsMessage(
      String documentSource,
      int systemChars,
      int userChars,
      int totalChars,
      int estimatedTokens,
      int questionCount) {
    String prefix =
        documentSource != null && !documentSource.isBlank() ? "[" + documentSource + "] " : "";
    return prefix
        + "Prompt: system "
        + formatThousands(systemChars)
        + " + user "
        + formatThousands(userChars)
        + " = "
        + formatThousands(totalChars)
        + " chars (~"
        + formatThousands(estimatedTokens)
        + " tokens)"
        + " | "
        + questionCount
        + " câu";
  }

  private static int sumMessageChars(List<Map<String, String>> messages) {
    int total = 0;
    for (Map<String, String> message : messages) {
      String content = message.get("content");
      if (content != null) {
        total += content.length();
      }
    }
    return total;
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

  private AiQuestionGenEnvelopeDTO parseEnvelope(String json) throws IdInvalidException {
    try {
      return objectMapper.readValue(json, AiQuestionGenEnvelopeDTO.class);
    } catch (JsonProcessingException e) {
      throw new IdInvalidException("AI trả JSON không hợp lệ");
    }
  }

  public static class GenerationResult {
    private AiQuestionGenEnvelopeDTO envelope;
    private Integer promptTokens;
    private Integer completionTokens;
    private String model;

    public AiQuestionGenEnvelopeDTO getEnvelope() {
      return envelope;
    }

    public void setEnvelope(AiQuestionGenEnvelopeDTO envelope) {
      this.envelope = envelope;
    }

    public Integer getPromptTokens() {
      return promptTokens;
    }

    public void setPromptTokens(Integer promptTokens) {
      this.promptTokens = promptTokens;
    }

    public Integer getCompletionTokens() {
      return completionTokens;
    }

    public void setCompletionTokens(Integer completionTokens) {
      this.completionTokens = completionTokens;
    }

    public String getModel() {
      return model;
    }

    public void setModel(String model) {
      this.model = model;
    }
  }
}
