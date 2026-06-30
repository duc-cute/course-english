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
import com.fasterxml.jackson.databind.JsonNode;
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
import java.util.LinkedHashMap;

@Service
public class AiQuestionGenerationService {

  private static final int LOG_PROMPT_MAX_LEN = 1200;
  private static final int MAX_QUOTA_RETRIES = 2;

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

  @Value("${app.ai.exam-section-log-detail-max-chars:50000}")
  private int examSectionLogDetailMaxChars;

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
      String promptLang,
      AiGenTraceContext trace) throws IdInvalidException {
    return generate(
        documentExcerpt,
        questionCount,
        questionTypes,
        difficulty,
        promptLang,
        trace,
        null,
        false,
        4,
        null);
  }

  public GenerationResult generate(
      String documentExcerpt,
      int questionCount,
      List<QuestionTypeEnum> questionTypes,
      int difficulty,
      String promptLang,
      AiGenTraceContext trace,
      Map<QuestionTypeEnum, Integer> typeQuotas,
      boolean topicMode,
      int readingSubQuestionCount,
      Map<QuestionTypeEnum, String> customUserPromptByType) throws IdInvalidException {
    if (typeQuotas != null && !typeQuotas.isEmpty()) {
      List<BatchSpec> specs = batchPlanner.planFromQuotas(typeQuotas);
      if (specs.isEmpty()) {
        throw new IdInvalidException("typeQuotas không hợp lệ");
      }
      return generateParallelBatched(
          documentExcerpt,
          specs,
          questionTypes,
          questionCount,
          difficulty,
          promptLang,
          trace,
          topicMode,
          readingSubQuestionCount,
          typeQuotas,
          customUserPromptByType);
    }
    if (shouldUseParallelBatch(questionCount, questionTypes)) {
      List<BatchSpec> specs = batchPlanner.plan(questionCount, questionTypes);
      return generateParallelBatched(
          documentExcerpt,
          specs,
          questionTypes,
          questionCount,
          difficulty,
          promptLang,
          trace,
          topicMode,
          readingSubQuestionCount,
          null,
          customUserPromptByType);
    }
    return generateSingleShot(
        documentExcerpt,
        questionCount,
        questionTypes,
        difficulty,
        promptLang,
        trace,
        streamEnabled,
        topicMode,
        readingSubQuestionCount,
        customUserPromptByType);
  }

  /** Backward-compatible overload without custom prompts. */
  public GenerationResult generate(
      String documentExcerpt,
      int questionCount,
      List<QuestionTypeEnum> questionTypes,
      int difficulty,
      String promptLang,
      AiGenTraceContext trace,
      Map<QuestionTypeEnum, Integer> typeQuotas,
      boolean topicMode,
      int readingSubQuestionCount) throws IdInvalidException {
    return generate(
        documentExcerpt,
        questionCount,
        questionTypes,
        difficulty,
        promptLang,
        trace,
        typeQuotas,
        topicMode,
        readingSubQuestionCount,
        null);
  }

  /** One exam section — instruction distinguishes MCQ variants (Synonyms vs Antonyms). */
  public GenerationResult generateExamSection(
      String documentExcerpt,
      QuestionTypeEnum type,
      int questionCount,
      int difficulty,
      String promptLang,
      AiGenTraceContext trace,
      int readingSubQuestionCount,
      String sectionTitle,
      String sectionInstruction,
      ExamSectionLogInfo sectionLog)
      throws IdInvalidException {
    return generateExamSection(
        documentExcerpt,
        type,
        questionCount,
        difficulty,
        promptLang,
        trace,
        readingSubQuestionCount,
        sectionTitle,
        sectionInstruction,
        sectionLog,
        false);
  }

  public GenerationResult generateExamSection(
      String documentExcerpt,
      QuestionTypeEnum type,
      int questionCount,
      int difficulty,
      String promptLang,
      AiGenTraceContext trace,
      int readingSubQuestionCount,
      String sectionTitle,
      String sectionInstruction,
      ExamSectionLogInfo sectionLog,
      boolean similarFromReference)
      throws IdInvalidException {
    String system = promptAssembler.buildSystemPromptForType(type, similarFromReference);
    String user =
        similarFromReference
            ? promptAssembler.buildSimilarExamSectionUserPrompt(
                documentExcerpt,
                questionCount,
                type,
                difficulty,
                promptLang,
                readingSubQuestionCount,
                sectionTitle,
                sectionInstruction)
            : promptAssembler.buildExamSectionUserPrompt(
                documentExcerpt,
                questionCount,
                type,
                difficulty,
                promptLang,
                readingSubQuestionCount,
                sectionTitle,
                sectionInstruction);

    List<Map<String, String>> messages =
        List.of(
            Map.of("role", "system", "content", system),
            Map.of("role", "user", "content", user));

    if (sectionLog != null) {
      logExamSectionPrompt(
          trace,
          sectionLog,
          system,
          user,
          documentExcerpt.length(),
          similarFromReference ? "exam_section_similar" : "exam_section");
    } else {
      logPromptAssembled(
          trace,
          documentExcerpt,
          system,
          user,
          questionCount,
          List.of(type),
          similarFromReference ? "exam_section_similar" : "exam_section");
    }

    OpenRouterClient.ChatResult chatResult = callWithJsonRetry(messages, trace, streamEnabled);

    if (sectionLog != null && chatResult.getContent() != null) {
      logExamSectionResponse(trace, sectionLog, chatResult);
    }

    return buildGenerationResult(
        chatResult, List.of(type), questionCount, difficulty, promptLang, "exam_section", null);
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
      boolean useStream,
      boolean topicMode,
      int readingSubQuestionCount,
      Map<QuestionTypeEnum, String> customUserPromptByType) throws IdInvalidException {
    String system = promptAssembler.buildSystemPrompt(questionTypes);
    if (topicMode && questionTypes.size() == 1) {
      system = promptAssembler.buildSystemPromptForType(questionTypes.get(0), true);
    }
    String user = resolveUserPrompt(
        documentExcerpt,
        questionCount,
        questionTypes,
        difficulty,
        promptLang,
        topicMode,
        readingSubQuestionCount,
        customUserPromptByType,
        questionTypes.size() == 1 ? questionTypes.get(0) : null,
        null);

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
      List<BatchSpec> specs,
      List<QuestionTypeEnum> questionTypes,
      int questionCount,
      int difficulty,
      String promptLang,
      AiGenTraceContext trace,
      boolean topicMode,
      int readingSubQuestionCount,
      Map<QuestionTypeEnum, Integer> typeQuotas,
      Map<QuestionTypeEnum, String> customUserPromptByType) throws IdInvalidException {
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
                      specs.size(),
                      topicMode,
                      readingSubQuestionCount,
                      customUserPromptByType,
                      null);
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

    Map<QuestionTypeEnum, Integer> quotaMap =
        typeQuotas != null && !typeQuotas.isEmpty()
            ? typeQuotas
            : specs.stream()
                .collect(Collectors.toMap(BatchSpec::type, BatchSpec::count, Integer::sum, LinkedHashMap::new));

    if (!quotaMap.isEmpty()) {
      fillQuotaDeficits(
          mergedQuestions,
          quotaMap,
          documentExcerpt,
          difficulty,
          promptLang,
          topicMode,
          readingSubQuestionCount,
          customUserPromptByType,
          trace);
      envelope.setQuestions(mergedQuestions);
      resultValidator.normalizeAndValidate(envelope, promptLang, difficulty);
    }

    applyMetaCounts(envelope, questionCount, quotaMap.isEmpty() ? null : quotaMap);

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
      int totalBatches,
      boolean topicMode,
      int readingSubQuestionCount,
      Map<QuestionTypeEnum, String> customUserPromptByType,
      List<String> existingSummariesForDeficit) {
    try {
      if (trace != null) {
        int startPercent = 12 + (batchIndex * 65 / Math.max(1, totalBatches));
        progressReporter.report(
            trace.getTaskId(),
            "Đang sinh " + spec.type().name() + " (" + spec.count() + " câu)…",
            startPercent);
      }

      String system = promptAssembler.buildSystemPromptForType(spec.type(), topicMode);
      String user =
          existingSummariesForDeficit != null
              ? promptAssembler.buildDeficitUserPrompt(
                  documentExcerpt,
                  spec.type(),
                  spec.count(),
                  difficulty,
                  promptLang,
                  topicMode,
                  readingSubQuestionCount,
                  existingSummariesForDeficit)
              : resolveUserPrompt(
                  documentExcerpt,
                  spec.count(),
                  List.of(spec.type()),
                  difficulty,
                  promptLang,
                  topicMode,
                  readingSubQuestionCount,
                  customUserPromptByType,
                  spec.type(),
                  null);
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
    applyMetaCounts(envelope, questionCount, null);

    GenerationResult result = new GenerationResult();
    result.setEnvelope(envelope);
    result.setPromptTokens(chatResult.getPromptTokens());
    result.setCompletionTokens(chatResult.getCompletionTokens());
    result.setModel(questionGenModel);
    return result;
  }

  private void applyMetaCounts(AiQuestionGenEnvelopeDTO envelope, int requestedCount) {
    applyMetaCounts(envelope, requestedCount, null);
  }

  private void applyMetaCounts(
      AiQuestionGenEnvelopeDTO envelope,
      int requestedCount,
      Map<QuestionTypeEnum, Integer> typeQuotas) {
    if (envelope.getMeta() == null) {
      envelope.setMeta(new AiQuestionGenMetaDTO());
    }
    int total = envelope.getQuestions() != null ? envelope.getQuestions().size() : 0;
    int valid = resultValidator.countValid(envelope.getQuestions());
    int invalid = total - valid;
    envelope.getMeta().setRequestedCount(requestedCount);
    envelope.getMeta().setValidCount(valid);
    envelope.getMeta().setInvalidCount(invalid);

    StringBuilder summary = new StringBuilder();
    if (invalid > 0 || total < requestedCount) {
      summary
          .append("Đã sinh ")
          .append(valid)
          .append("/")
          .append(requestedCount)
          .append(" câu hợp lệ");
      if (invalid > 0) {
        summary.append(" (").append(invalid).append(" câu lỗi định dạng)");
      }
    }
    if (typeQuotas != null && !typeQuotas.isEmpty()) {
      Map<QuestionTypeEnum, Integer> actual =
          resultValidator.countValidByType(envelope.getQuestions());
      List<String> gaps = new ArrayList<>();
      for (Map.Entry<QuestionTypeEnum, Integer> entry : typeQuotas.entrySet()) {
        int got = actual.getOrDefault(entry.getKey(), 0);
        if (got != entry.getValue()) {
          gaps.add(entry.getKey().name() + " " + got + "/" + entry.getValue());
        }
      }
      if (!gaps.isEmpty()) {
        if (summary.length() > 0) {
          summary.append(" — ");
        }
        summary.append("Quota: ").append(String.join(", ", gaps));
      }
    }
    if (summary.length() > 0) {
      envelope.getMeta().setSummaryMessage(summary.toString());
    }
  }

  private String resolveUserPrompt(
      String documentExcerpt,
      int questionCount,
      List<QuestionTypeEnum> questionTypes,
      int difficulty,
      String promptLang,
      boolean topicMode,
      int readingSubQuestionCount,
      Map<QuestionTypeEnum, String> customUserPromptByType,
      QuestionTypeEnum singleType,
      List<String> existingSummariesForDeficit) {
    if (existingSummariesForDeficit != null && singleType != null) {
      return promptAssembler.buildDeficitUserPrompt(
          documentExcerpt,
          singleType,
          questionCount,
          difficulty,
          promptLang,
          topicMode,
          readingSubQuestionCount,
          existingSummariesForDeficit);
    }
    if (singleType != null && customUserPromptByType != null) {
      String override = customUserPromptByType.get(singleType);
      if (override != null && !override.isBlank()) {
        return override.trim();
      }
    }
    return promptAssembler.buildUserPrompt(
        documentExcerpt,
        questionCount,
        questionTypes,
        difficulty,
        promptLang,
        topicMode,
        readingSubQuestionCount);
  }

  private void fillQuotaDeficits(
      List<AiDraftQuestionDTO> merged,
      Map<QuestionTypeEnum, Integer> quotas,
      String documentExcerpt,
      int difficulty,
      String promptLang,
      boolean topicMode,
      int readingSubQuestionCount,
      Map<QuestionTypeEnum, String> customUserPromptByType,
      AiGenTraceContext trace) throws IdInvalidException {
    for (int round = 0; round < MAX_QUOTA_RETRIES; round++) {
      Map<QuestionTypeEnum, Integer> deficits = computeDeficits(merged, quotas);
      if (deficits.isEmpty()) {
        return;
      }
      for (Map.Entry<QuestionTypeEnum, Integer> entry : deficits.entrySet()) {
        QuestionTypeEnum type = entry.getKey();
        int deficit = entry.getValue();
        if (trace != null) {
          progressReporter.report(
              trace.getTaskId(),
              "Bù quota " + type.name() + " (+" + deficit + ", lần " + (round + 1) + ")…",
              88);
        }
        List<String> existing = summarizeExistingForType(merged, type);
        BatchSpec spec = new BatchSpec(type, deficit);
        BatchOutcome outcome =
            runBatch(
                documentExcerpt,
                spec,
                difficulty,
                promptLang,
                trace,
                0,
                1,
                topicMode,
                readingSubQuestionCount,
                customUserPromptByType,
                existing);
        if (outcome.error() == null && outcome.questions() != null && !outcome.questions().isEmpty()) {
          merged.addAll(outcome.questions());
        }
        AiQuestionGenEnvelopeDTO tmp = new AiQuestionGenEnvelopeDTO();
        tmp.setQuestions(new ArrayList<>(merged));
        resultValidator.normalizeAndValidate(tmp, promptLang, difficulty);
        merged.clear();
        merged.addAll(tmp.getQuestions());
      }
    }
  }

  private Map<QuestionTypeEnum, Integer> computeDeficits(
      List<AiDraftQuestionDTO> merged, Map<QuestionTypeEnum, Integer> quotas) {
    Map<QuestionTypeEnum, Integer> actual = resultValidator.countValidByType(merged);
    Map<QuestionTypeEnum, Integer> deficits = new LinkedHashMap<>();
    for (Map.Entry<QuestionTypeEnum, Integer> entry : quotas.entrySet()) {
      int got = actual.getOrDefault(entry.getKey(), 0);
      int need = entry.getValue() - got;
      if (need > 0) {
        deficits.put(entry.getKey(), need);
      }
    }
    return deficits;
  }

  private List<String> summarizeExistingForType(List<AiDraftQuestionDTO> merged, QuestionTypeEnum type) {
    List<String> summaries = new ArrayList<>();
    if (merged == null) {
      return summaries;
    }
    for (AiDraftQuestionDTO draft : merged) {
      if (draft.getQuestionType() != type) {
        continue;
      }
      if (draft.getValidationErrors() != null && !draft.getValidationErrors().isEmpty()) {
        continue;
      }
      summaries.add(summarizeDraftItem(draft));
    }
    return summaries;
  }

  private String summarizeDraftItem(AiDraftQuestionDTO draft) {
    if (draft.getQuestionType() == QuestionTypeEnum.READING_COMPREHENSION && draft.getContentJson() != null) {
      JsonNode node = draft.getContentJson();
      JsonNode passage = node.get("passage");
      if (passage != null && passage.hasNonNull("title")) {
        return passage.get("title").asText();
      }
      if (passage != null && passage.hasNonNull("text")) {
        String text = passage.get("text").asText().trim();
        return text.length() > 64 ? text.substring(0, 64) + "…" : text;
      }
    }
    String text = draft.getPromptText() != null ? draft.getPromptText().trim() : "";
    if (text.length() > 72) {
      return text.substring(0, 72) + "…";
    }
    return text.isEmpty() ? draft.getQuestionType().name() : text;
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

  private void logExamSectionPrompt(
      AiGenTraceContext trace,
      ExamSectionLogInfo section,
      String system,
      String user,
      int documentChars,
      String generationMode) {
    if (trace == null) {
      return;
    }
    int systemChars = system.length();
    int userChars = user.length();
    int totalChars = systemChars + userChars;
    String sectionLabel = formatExamSectionLogLabel(section);
    String detail =
        sectionLabel
            + "\n\n--- SYSTEM PROMPT ---\n"
            + system
            + "\n\n--- USER PROMPT (document + section instructions) ---\n"
            + user;

    activityLogService.log(
        ActivityLogWriteContext.of(
                ActivityLogSeverityEnum.INFO,
                ActivityLogModuleEnum.AI,
                ActivityLogActionEnum.AI_GEN_PROMPT,
                "[Section "
                    + (section.sectionIndex() + 1)
                    + "/"
                    + section.sectionTotal()
                    + "] Prompt gửi AI"
                    + (section.sectionTitle() != null && !section.sectionTitle().isBlank()
                        ? " — " + section.sectionTitle().trim()
                        : ""))
            .userId(trace.getUserId())
            .ref("AI_TASK", trace.getTaskId())
            .detail(detail)
            .detailMaxChars(examSectionLogDetailMaxChars)
            .put("taskId", trace.getTaskId())
            .put("documentId", trace.getDocumentId())
            .put("documentSource", trace.getDocumentSource())
            .put("step", "exam_section_prompt")
            .put("generationMode", generationMode != null ? generationMode : "exam_section")
            .put("sectionIndex", section.sectionIndex())
            .put("sectionTotal", section.sectionTotal())
            .put("sectionTitle", section.sectionTitle())
            .put("sectionInstruction", section.sectionInstruction())
            .put("questionType", section.questionType() != null ? section.questionType().name() : null)
            .put("questionCount", section.questionCount())
            .put("readingSubQuestionCount", section.readingSubQuestionCount())
            .put("model", questionGenModel)
            .put("documentChars", documentChars)
            .put("systemPromptChars", systemChars)
            .put("userPromptChars", userChars)
            .put("totalPromptChars", totalChars)
            .put("estimatedInputTokens", Math.max(1, totalChars / 4)));
  }

  private void logExamSectionResponse(
      AiGenTraceContext trace, ExamSectionLogInfo section, OpenRouterClient.ChatResult chatResult) {
    if (trace == null) {
      return;
    }
    String rawJson = chatResult.getContent() != null ? chatResult.getContent().trim() : "";
    String sectionLabel = formatExamSectionLogLabel(section);
    String detail = sectionLabel + "\n\n--- AI JSON RESPONSE ---\n" + rawJson;

    activityLogService.log(
        ActivityLogWriteContext.of(
                ActivityLogSeverityEnum.INFO,
                ActivityLogModuleEnum.AI,
                ActivityLogActionEnum.AI_GEN_RESPONSE,
                "[Section "
                    + (section.sectionIndex() + 1)
                    + "/"
                    + section.sectionTotal()
                    + "] JSON AI trả về"
                    + (section.sectionTitle() != null && !section.sectionTitle().isBlank()
                        ? " — " + section.sectionTitle().trim()
                        : ""))
            .userId(trace.getUserId())
            .ref("AI_TASK", trace.getTaskId())
            .detail(detail)
            .detailMaxChars(examSectionLogDetailMaxChars)
            .put("taskId", trace.getTaskId())
            .put("documentId", trace.getDocumentId())
            .put("step", "exam_section_response_json")
            .put("generationMode", "exam_section")
            .put("sectionIndex", section.sectionIndex())
            .put("sectionTotal", section.sectionTotal())
            .put("sectionTitle", section.sectionTitle())
            .put("questionType", section.questionType() != null ? section.questionType().name() : null)
            .put("model", questionGenModel)
            .put("promptTokens", chatResult.getPromptTokens())
            .put("completionTokens", chatResult.getCompletionTokens())
            .put("responseChars", rawJson.length())
            .put("durationMs", chatResult.getDurationMs()));
  }

  private static String formatExamSectionLogLabel(ExamSectionLogInfo section) {
    StringBuilder sb = new StringBuilder();
    sb.append("=== SECTION ")
        .append(section.sectionIndex() + 1)
        .append("/")
        .append(section.sectionTotal());
    if (section.sectionTitle() != null && !section.sectionTitle().isBlank()) {
      sb.append(": ").append(section.sectionTitle().trim());
    }
    sb.append(" ===");
    if (section.questionType() != null) {
      sb.append("\nType: ").append(section.questionType().name());
    }
    if (section.questionType() == QuestionTypeEnum.READING_COMPREHENSION) {
      sb.append(" | 1 passage × ")
          .append(section.readingSubQuestionCount())
          .append(" sub-questions");
    } else {
      sb.append(" | questionCount: ").append(section.questionCount());
    }
    if (section.sectionInstruction() != null && !section.sectionInstruction().isBlank()) {
      sb.append("\nInstruction: ").append(section.sectionInstruction().trim());
    }
    return sb.toString();
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
