package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.request.ExamSectionGenSpecDTO;
import com.courseenglish.api.domain.request.ReqCreateExamPaperGenTaskDTO;
import com.courseenglish.api.service.ai.question.AiQuestionGenResultValidator;
import com.courseenglish.api.service.ai.question.dto.AiDraftQuestionDTO;
import com.courseenglish.api.service.ai.question.dto.AiExamPaperGenEnvelopeDTO;
import com.courseenglish.api.service.ai.question.dto.AiExamPaperGenSectionDTO;
import com.courseenglish.api.service.ai.question.dto.AiQuestionGenEnvelopeDTO;
import com.courseenglish.api.service.ai.question.dto.AiQuestionGenMetaDTO;
import com.courseenglish.api.service.ActivityLogService;
import com.courseenglish.api.service.activitylog.ActivityLogWriteContext;
import com.courseenglish.api.util.constant.ActivityLogActionEnum;
import com.courseenglish.api.util.constant.ActivityLogModuleEnum;
import com.courseenglish.api.util.constant.ActivityLogSeverityEnum;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class AiExamPaperGenerationService {

  private static final Logger log = LoggerFactory.getLogger(AiExamPaperGenerationService.class);
  private static final int READING_MIN_SUB_QUESTIONS = 2;
  private static final int READING_MAX_SUB_QUESTIONS = 12;

  private final AiQuestionGenerationService aiQuestionGenerationService;
  private final AiQuestionGenResultValidator resultValidator;
  private final AiTaskProgressReporter progressReporter;
  private final ActivityLogService activityLogService;
  private final ExamSectionSliceService examSectionSliceService;
  private final Executor aiOpenRouterExecutor;

  @Value("${app.ai.question-gen-batch-max-concurrent:2}")
  private int batchMaxConcurrent;

  @Value("${app.ai.question-gen-model:anthropic/claude-3.5-sonnet}")
  private String questionGenModel;

  @Value("${app.ai.exam-paper-max-task-sec:600}")
  private int examPaperMaxTaskSec;

  public AiExamPaperGenerationService(
      AiQuestionGenerationService aiQuestionGenerationService,
      AiQuestionGenResultValidator resultValidator,
      AiTaskProgressReporter progressReporter,
      ActivityLogService activityLogService,
      ExamSectionSliceService examSectionSliceService,
      @Qualifier("aiOpenRouterExecutor") Executor aiOpenRouterExecutor) {
    this.aiQuestionGenerationService = aiQuestionGenerationService;
    this.resultValidator = resultValidator;
    this.progressReporter = progressReporter;
    this.activityLogService = activityLogService;
    this.examSectionSliceService = examSectionSliceService;
    this.aiOpenRouterExecutor = aiOpenRouterExecutor;
  }

  public AiExamPaperGenEnvelopeDTO generate(
      String documentExcerpt,
      ReqCreateExamPaperGenTaskDTO input,
      AiGenTraceContext trace,
      long taskWallStartMs) throws IdInvalidException {
    List<ExamSectionGenSpecDTO> specs = input.getSectionSpecs();
    if (specs == null || specs.isEmpty()) {
      throw new IdInvalidException("Thiếu sectionSpecs");
    }

    int difficulty = input.getDifficulty() != null ? input.getDifficulty() : 2;
    String promptLang = input.getPromptLang() != null ? input.getPromptLang() : "en";
    int readingSubQuestionCount =
        input.getReadingSubQuestionCount() != null ? input.getReadingSubQuestionCount() : 4;

    boolean similarMode = isSimilarGeneration(input);

    long maxTaskMs = Math.max(1, examPaperMaxTaskSec) * 1000L;
    long deadlineMs = taskWallStartMs + maxTaskMs;

    int maxConcurrent = Math.max(1, Math.min(batchMaxConcurrent, specs.size()));
    Semaphore semaphore = new Semaphore(maxConcurrent);
    AtomicInteger completed = new AtomicInteger(0);

    List<CompletableFuture<SectionOutcome>> futures = new ArrayList<>();
    for (int i = 0; i < specs.size(); i++) {
      final ExamSectionGenSpecDTO spec = specs.get(i);
      final int index = i;
      futures.add(
          CompletableFuture.supplyAsync(
              () -> {
                long sectionStartedMs = System.currentTimeMillis();
                try {
                  semaphore.acquire();
                  if (System.currentTimeMillis() >= deadlineMs) {
                    String timeoutMsg = examPaperTimeoutMessage();
                    logSectionEvent(
                        trace,
                        "failed",
                        index,
                        spec,
                        specs.size(),
                        timeoutMsg,
                        System.currentTimeMillis() - sectionStartedMs,
                        null,
                        null,
                        documentExcerpt.length(),
                        0);
                    return SectionOutcome.failed(spec, timeoutMsg, index, System.currentTimeMillis() - sectionStartedMs);
                  }
                  String sectionExcerpt = resolveSectionExcerpt(documentExcerpt, spec, similarMode);
                  logSectionEvent(
                      trace,
                      "start",
                      index,
                      spec,
                      specs.size(),
                      null,
                      0,
                      null,
                      null,
                      documentExcerpt.length(),
                      sectionExcerpt.length());
                  if (trace != null) {
                    progressReporter.reportMilestone(
                        trace.getTaskId(),
                        "Đang sinh: " + sectionLabel(spec, index, specs.size()) + "…",
                        10 + (index * 80 / Math.max(1, specs.size())));
                  }
                  ResolvedSectionGen resolved = resolveSectionGenParams(spec, readingSubQuestionCount);
                  ExamSectionLogInfo sectionLog =
                      new ExamSectionLogInfo(
                          index,
                          specs.size(),
                          spec.getTitle(),
                          spec.getInstruction(),
                          spec.getQuestionType(),
                          resolved.questionCount(),
                          resolved.readingSubQuestionCount());
                  AiQuestionGenerationService.GenerationResult result =
                      aiQuestionGenerationService.generateExamSection(
                          sectionExcerpt,
                          spec.getQuestionType(),
                          resolved.questionCount(),
                          difficulty,
                          promptLang,
                          trace,
                          resolved.readingSubQuestionCount(),
                          spec.getTitle(),
                          spec.getInstruction(),
                          sectionLog,
                          similarMode);
                  long durationMs = System.currentTimeMillis() - sectionStartedMs;
                  logSectionEvent(
                      trace,
                      "done",
                      index,
                      spec,
                      specs.size(),
                      null,
                      durationMs,
                      result.getPromptTokens(),
                      result.getCompletionTokens(),
                      documentExcerpt.length(),
                      sectionExcerpt.length());
                  return SectionOutcome.ok(spec, result, index, durationMs);
                } catch (Exception e) {
                  long durationMs = System.currentTimeMillis() - sectionStartedMs;
                  String error = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                  String sectionExcerpt = resolveSectionExcerpt(documentExcerpt, spec, similarMode);
                  logSectionEvent(
                      trace,
                      "failed",
                      index,
                      spec,
                      specs.size(),
                      error,
                      durationMs,
                      null,
                      null,
                      documentExcerpt.length(),
                      sectionExcerpt.length());
                  return SectionOutcome.failed(spec, error, index, durationMs);
                } finally {
                  semaphore.release();
                  if (trace != null) {
                    int done = completed.incrementAndGet();
                    progressReporter.reportMilestone(
                        trace.getTaskId(),
                        "Hoàn thành " + done + "/" + specs.size() + " section",
                        10 + (done * 85 / specs.size()));
                  }
                }
              },
              aiOpenRouterExecutor));
    }

    long waitMs = Math.max(0, deadlineMs - System.currentTimeMillis());
    if (waitMs == 0) {
      logExamPaperTaskTimeout(trace, taskWallStartMs, specs.size());
      throw new IdInvalidException(examPaperTimeoutMessage());
    }
    try {
      CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).get(waitMs, TimeUnit.MILLISECONDS);
    } catch (TimeoutException e) {
      futures.forEach(f -> f.cancel(true));
      logExamPaperTaskTimeout(trace, taskWallStartMs, specs.size());
      throw new IdInvalidException(examPaperTimeoutMessage());
    } catch (ExecutionException e) {
      throw new IdInvalidException(
          e.getCause() != null && e.getCause().getMessage() != null
              ? e.getCause().getMessage()
              : "Sinh đề thất bại");
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new IdInvalidException("Sinh đề bị gián đoạn");
    }

    if (System.currentTimeMillis() - taskWallStartMs > maxTaskMs) {
      logExamPaperTaskTimeout(trace, taskWallStartMs, specs.size());
      throw new IdInvalidException(examPaperTimeoutMessage());
    }

    AiExamPaperGenEnvelopeDTO envelope = new AiExamPaperGenEnvelopeDTO();
    envelope.setSchemaVersion(1);
    envelope.setExamTitle(input.getExamTitle());
    envelope.setPaperInstruction(input.getPaperInstruction());

    List<String> errors = new ArrayList<>();
    int totalPromptTokens = 0;
    int totalCompletionTokens = 0;
    int sectionIndex = 0;

    for (CompletableFuture<SectionOutcome> future : futures) {
      SectionOutcome outcome = future.join();
      sectionIndex++;
      if (outcome.error() != null) {
        errors.add(
            (outcome.spec().getTitle() != null ? outcome.spec().getTitle() : "Section " + sectionIndex)
                + ": "
                + outcome.error());
        continue;
      }
      AiExamPaperGenSectionDTO section = new AiExamPaperGenSectionDTO();
      section.setTitle(outcome.spec().getTitle());
      section.setInstruction(outcome.spec().getInstruction());
      section.setQuestionType(outcome.spec().getQuestionType());
      List<AiDraftQuestionDTO> questions =
          outcome.result().getEnvelope() != null ? outcome.result().getEnvelope().getQuestions() : List.of();
      section.setQuestions(questions != null ? new ArrayList<>(questions) : new ArrayList<>());
      envelope.getSections().add(section);

      if (outcome.result().getPromptTokens() != null) {
        totalPromptTokens += outcome.result().getPromptTokens();
      }
      if (outcome.result().getCompletionTokens() != null) {
        totalCompletionTokens += outcome.result().getCompletionTokens();
      }
    }

    String timeoutMsg = examPaperTimeoutMessage();
    if (errors.stream().anyMatch(e -> e.contains(timeoutMsg) || e.contains("quá lâu"))) {
      logExamPaperTaskTimeout(trace, taskWallStartMs, specs.size());
      throw new IdInvalidException(timeoutMsg);
    }

    if (envelope.getSections().isEmpty()) {
      throw new IdInvalidException(
          "Sinh đề thất bại — " + (errors.isEmpty() ? "không có section nào thành công" : String.join("; ", errors)));
    }

    AiQuestionGenMetaDTO meta = new AiQuestionGenMetaDTO();
    meta.setModel(questionGenModel);
    meta.setGenerationMode("exam_paper_parallel");
    meta.setBatchCount(specs.size());
    if (!errors.isEmpty()) {
      meta.setSummaryMessage("Một số section lỗi: " + String.join("; ", errors));
    }
    envelope.setMeta(meta);

    for (AiExamPaperGenSectionDTO section : envelope.getSections()) {
      if (section.getQuestions() != null && !section.getQuestions().isEmpty()) {
        AiQuestionGenEnvelopeDTO sectionEnvelope = new AiQuestionGenEnvelopeDTO();
        sectionEnvelope.setSchemaVersion(1);
        sectionEnvelope.setQuestions(section.getQuestions());
        resultValidator.normalizeAndValidate(sectionEnvelope, promptLang, difficulty);
        section.setQuestions(sectionEnvelope.getQuestions());
      }
    }

    return envelope;
  }

  private String sectionLabel(ExamSectionGenSpecDTO spec, int index, int total) {
    String title =
        spec.getTitle() != null && !spec.getTitle().isBlank()
            ? spec.getTitle().trim()
            : "Section " + (index + 1);
    if (spec.getQuestionType() == QuestionTypeEnum.READING_COMPREHENSION) {
      return (index + 1)
          + "/"
          + total
          + " "
          + title
          + " (1 đoạn × "
          + spec.getQuestionCount()
          + " câu con)";
    }
    if (spec.getQuestionType() == QuestionTypeEnum.GAP_FILL_MCQ) {
      return (index + 1)
          + "/"
          + total
          + " "
          + title
          + " (1 đoạn cloze × "
          + spec.getQuestionCount()
          + " ô)";
    }
    return (index + 1)
        + "/"
        + total
        + " "
        + title
        + " ("
        + spec.getQuestionType().name()
        + "×"
        + spec.getQuestionCount()
        + ")";
  }

  /**
   * Exam outline stores sub-question count for READING sections (e.g. questions 11–20 → 10).
   * Generation expects questionCount = passages and readingSubQuestionCount = sub-questions.
   */
  private ResolvedSectionGen resolveSectionGenParams(
      ExamSectionGenSpecDTO spec, int defaultReadingSubs) {
    if (spec.getQuestionType() == QuestionTypeEnum.READING_COMPREHENSION) {
      if (spec.getReadingSubQuestionCount() != null) {
        int passages = Math.max(1, Math.min(5, spec.getQuestionCount()));
        int subs =
            Math.max(
                READING_MIN_SUB_QUESTIONS,
                Math.min(READING_MAX_SUB_QUESTIONS, spec.getReadingSubQuestionCount()));
        return new ResolvedSectionGen(passages, subs);
      }
      int subs =
          Math.max(
              READING_MIN_SUB_QUESTIONS,
              Math.min(READING_MAX_SUB_QUESTIONS, spec.getQuestionCount()));
      return new ResolvedSectionGen(1, subs);
    }
    if (spec.getQuestionType() == QuestionTypeEnum.GAP_FILL_MCQ) {
      int blanks =
          spec.getReadingSubQuestionCount() != null
              ? Math.max(2, Math.min(12, spec.getReadingSubQuestionCount()))
              : Math.max(2, Math.min(12, spec.getQuestionCount()));
      return new ResolvedSectionGen(1, blanks);
    }
    return new ResolvedSectionGen(spec.getQuestionCount(), defaultReadingSubs);
  }

  private record ResolvedSectionGen(int questionCount, int readingSubQuestionCount) {}

  private static boolean isSimilarGeneration(ReqCreateExamPaperGenTaskDTO input) {
    return input != null
        && ExamPaperSimilarGenService.GENERATION_MODE_SIMILAR.equalsIgnoreCase(input.getGenerationMode());
  }

  private String resolveSectionExcerpt(
      String documentExcerpt, ExamSectionGenSpecDTO spec, boolean similarMode) {
    if (similarMode
        && spec.getReferenceExcerpt() != null
        && !spec.getReferenceExcerpt().isBlank()) {
      return spec.getReferenceExcerpt();
    }
    return examSectionSliceService.extractSectionText(documentExcerpt, spec);
  }

  private void logSectionEvent(
      AiGenTraceContext trace,
      String phase,
      int sectionIndex,
      ExamSectionGenSpecDTO spec,
      int sectionTotal,
      String error,
      long durationMs,
      Integer promptTokens,
      Integer completionTokens,
      int documentChars,
      int sectionExcerptChars) {
    String label = sectionLabel(spec, sectionIndex, sectionTotal);
    log.info(
        "[ExamPaperGen] taskId={} section {} phase={} durationMs={} type={} count={} title={}",
        trace != null ? trace.getTaskId() : null,
        sectionIndex + 1,
        phase,
        durationMs,
        spec.getQuestionType(),
        spec.getQuestionCount(),
        spec.getTitle());
    if (trace == null) {
      return;
    }
    ActivityLogActionEnum action =
        "failed".equals(phase) ? ActivityLogActionEnum.AI_GEN_FAILED : ActivityLogActionEnum.AI_GEN_RESPONSE;
    if ("start".equals(phase)) {
      action = ActivityLogActionEnum.AI_GEN_START;
    }
    String message =
        switch (phase) {
          case "start" -> "Bắt đầu sinh section — " + label;
          case "done" ->
              "Xong section — "
                  + label
                  + " ("
                  + durationMs
                  + "ms"
                  + (promptTokens != null ? ", in=" + promptTokens + " tok" : "")
                  + (completionTokens != null ? ", out=" + completionTokens + " tok" : "")
                  + ")";
          default -> "Lỗi section — " + label + ": " + error;
        };
    ActivityLogWriteContext ctx =
        ActivityLogWriteContext.of(
                "failed".equals(phase) ? ActivityLogSeverityEnum.WARN : ActivityLogSeverityEnum.INFO,
                ActivityLogModuleEnum.AI,
                action,
                message)
            .userId(trace.getUserId())
            .ref("AI_TASK", trace.getTaskId())
            .put("taskId", trace.getTaskId())
            .put("documentId", trace.getDocumentId())
            .put("step", "exam_section_" + phase)
            .put("sectionIndex", sectionIndex)
            .put("sectionTotal", sectionTotal)
            .put("sectionTitle", spec.getTitle())
            .put("questionType", spec.getQuestionType().name())
            .put("questionCount", spec.getQuestionCount())
            .put("documentChars", documentChars)
            .put("sectionExcerptChars", sectionExcerptChars)
            .put("sliceMode", spec.getSliceMode())
            .put("sliceConfidence", spec.getSliceConfidence())
            .put("useFullDocument", Boolean.TRUE.equals(spec.getUseFullDocument()));
    if (spec.getExcerptStart() != null) {
      ctx.put("excerptStart", spec.getExcerptStart());
    }
    if (spec.getExcerptEnd() != null) {
      ctx.put("excerptEnd", spec.getExcerptEnd());
    }
    if (spec.getQuestionType() == QuestionTypeEnum.READING_COMPREHENSION) {
      ctx.put("passageCount", 1);
      ctx.put("subQuestionCount", spec.getQuestionCount());
    }
    if (durationMs > 0) {
      ctx.put("durationMs", durationMs);
    }
    if (promptTokens != null) {
      ctx.put("promptTokens", promptTokens);
    }
    if (completionTokens != null) {
      ctx.put("completionTokens", completionTokens);
    }
    if (error != null) {
      ctx.put("error", error);
    }
    activityLogService.log(ctx);
  }

  private String examPaperTimeoutMessage() {
    int sec = Math.max(1, examPaperMaxTaskSec);
    if (sec >= 60 && sec % 60 == 0) {
      return "Sinh đề quá lâu — vượt giới hạn " + (sec / 60) + " phút";
    }
    return "Sinh đề quá lâu — vượt giới hạn " + sec + " giây";
  }

  private void logExamPaperTaskTimeout(AiGenTraceContext trace, long taskWallStartMs, int sectionTotal) {
    if (trace == null) {
      return;
    }
    long elapsedMs = System.currentTimeMillis() - taskWallStartMs;
    activityLogService.log(
        ActivityLogWriteContext.of(
                ActivityLogSeverityEnum.WARN,
                ActivityLogModuleEnum.AI,
                ActivityLogActionEnum.AI_OR_TIMEOUT,
                examPaperTimeoutMessage() + " (" + elapsedMs + "ms)")
            .userId(trace.getUserId())
            .ref("AI_TASK", trace.getTaskId())
            .put("taskId", trace.getTaskId())
            .put("documentId", trace.getDocumentId())
            .put("step", "exam_paper_task_timeout")
            .put("maxTaskSec", examPaperMaxTaskSec)
            .put("elapsedMs", elapsedMs)
            .put("sectionTotal", sectionTotal));
  }

  private record SectionOutcome(
      ExamSectionGenSpecDTO spec,
      AiQuestionGenerationService.GenerationResult result,
      String error,
      int sectionIndex,
      long durationMs) {

    static SectionOutcome ok(
        ExamSectionGenSpecDTO spec,
        AiQuestionGenerationService.GenerationResult result,
        int sectionIndex,
        long durationMs) {
      return new SectionOutcome(spec, result, null, sectionIndex, durationMs);
    }

    static SectionOutcome failed(
        ExamSectionGenSpecDTO spec, String error, int sectionIndex, long durationMs) {
      return new SectionOutcome(
          spec, null, error != null ? error : "Lỗi không xác định", sectionIndex, durationMs);
    }
  }
}
