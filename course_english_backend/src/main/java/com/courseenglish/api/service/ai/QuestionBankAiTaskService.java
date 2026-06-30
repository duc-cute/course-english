package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.request.ReqBulkQuestionBankAiDTO;
import com.courseenglish.api.domain.request.ReqCreateQuestionGenTaskDTO;
import com.courseenglish.api.domain.request.ReqQuestionBankAiRewriteDTO;
import com.courseenglish.api.domain.request.ReqQuestionBankAiSimilarDTO;
import com.courseenglish.api.domain.response.ResBulkQuestionBankAiDTO;
import com.courseenglish.api.domain.response.ResCreateAiTaskDTO;
import com.courseenglish.api.domain.response.ResQuestionBankAiTaskDTO;
import com.courseenglish.api.domain.response.ResQuestionDTO;
import com.courseenglish.api.service.ActivityLogService;
import com.courseenglish.api.service.QuestionService;
import com.courseenglish.api.service.activitylog.ActivityLogWriteContext;
import com.courseenglish.api.service.ai.question.AiQuestionTypeHandlerRegistry;
import com.courseenglish.api.util.constant.ActivityLogActionEnum;
import com.courseenglish.api.util.constant.ActivityLogModuleEnum;
import com.courseenglish.api.util.constant.ActivityLogSeverityEnum;
import com.courseenglish.api.util.constant.AiTaskStatusEnum;
import com.courseenglish.api.util.constant.QuestionBankAiActionEnum;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

@Service
public class QuestionBankAiTaskService {

  private final QuestionService questionService;
  private final AiDocumentService aiDocumentService;
  private final AiTaskCommandService aiTaskCommandService;
  private final QuestionBankReferenceExcerptBuilder excerptBuilder;
  private final AiQuestionTypeHandlerRegistry handlerRegistry;
  private final AiAccessSupport aiAccessSupport;
  private final ActivityLogService activityLogService;
  private final ObjectMapper objectMapper;

  @Value("${app.ai.supported-gen-types:MULTIPLE_CHOICE,TRUE_FALSE,FILL_BLANK,GAP_FILL_MCQ,READING_COMPREHENSION}")
  private String supportedGenTypesCsv;

  public QuestionBankAiTaskService(
      QuestionService questionService,
      AiDocumentService aiDocumentService,
      AiTaskCommandService aiTaskCommandService,
      QuestionBankReferenceExcerptBuilder excerptBuilder,
      AiQuestionTypeHandlerRegistry handlerRegistry,
      AiAccessSupport aiAccessSupport,
      ActivityLogService activityLogService,
      ObjectMapper objectMapper) {
    this.questionService = questionService;
    this.aiDocumentService = aiDocumentService;
    this.aiTaskCommandService = aiTaskCommandService;
    this.excerptBuilder = excerptBuilder;
    this.handlerRegistry = handlerRegistry;
    this.aiAccessSupport = aiAccessSupport;
    this.activityLogService = activityLogService;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public ResQuestionBankAiTaskDTO createSimilarTask(UUID sourceId, ReqQuestionBankAiSimilarDTO request)
      throws IdInvalidException {
    ResQuestionDTO source = questionService.getById(sourceId);
    requireSupportedType(source.getQuestionType());

    int count = request != null && request.getQuestionCount() > 0 ? request.getQuestionCount() : 1;
    String excerpt = excerptBuilder.buildSimilarExcerpt(source);
    if (request != null && request.getAdditionalInstructions() != null && !request.getAdditionalInstructions().isBlank()) {
      excerpt = excerpt + "\n\nAdditional instructions:\n" + request.getAdditionalInstructions().trim();
    }

    ReqCreateQuestionGenTaskDTO input = buildBaseInput(source, count, QuestionBankAiActionEnum.SIMILAR);
    input.setSourceQuestionId(sourceId);
    if (request != null) {
      input.setAdditionalInstructions(request.getAdditionalInstructions());
    }

    ResCreateAiTaskDTO created = aiTaskCommandService.createQuestionBankAiTask(input, excerpt, "Similar");
    return toBankTaskDto(created, sourceId, null, QuestionBankAiActionEnum.SIMILAR);
  }

  @Transactional
  public ResQuestionBankAiTaskDTO createRewriteTask(UUID sourceId, ReqQuestionBankAiRewriteDTO request)
      throws IdInvalidException {
    if (request == null || request.getMode() == null) {
      throw new IdInvalidException("Thiếu mode (REWRITE / SIMPLIFY / INCREASE_DIFFICULTY)");
    }
    QuestionBankAiActionEnum mode = request.getMode();
    if (mode == QuestionBankAiActionEnum.SIMILAR) {
      throw new IdInvalidException("Dùng endpoint /ai/similar cho SIMILAR");
    }

    ResQuestionDTO source = questionService.getById(sourceId);
    requireSupportedType(source.getQuestionType());

    ResQuestionDTO fork = questionService.duplicateForFork(sourceId);
    String excerpt = excerptBuilder.buildRewriteExcerpt(source);

    ReqCreateQuestionGenTaskDTO input = buildBaseInput(source, 1, mode);
    input.setSourceQuestionId(sourceId);
    input.setTargetQuestionId(fork.getId());
    if (mode == QuestionBankAiActionEnum.INCREASE_DIFFICULTY) {
      int base = source.getDifficulty() != null ? source.getDifficulty() : 2;
      input.setDifficulty(Math.min(5, base + 1));
    } else if (mode == QuestionBankAiActionEnum.SIMPLIFY) {
      int base = source.getDifficulty() != null ? source.getDifficulty() : 2;
      input.setDifficulty(Math.max(1, base - 1));
    }

    String label =
        switch (mode) {
          case REWRITE -> "Rewrite";
          case SIMPLIFY -> "Simplify";
          case INCREASE_DIFFICULTY -> "Increase difficulty";
          default -> mode.name();
        };

    ResCreateAiTaskDTO created = aiTaskCommandService.createQuestionBankAiTask(input, excerpt, label);
    return toBankTaskDto(created, sourceId, fork.getId(), mode);
  }

  @Transactional
  public ResBulkQuestionBankAiDTO createBulkTasks(ReqBulkQuestionBankAiDTO request) throws IdInvalidException {
    if (request.getAction() != QuestionBankAiActionEnum.SIMILAR) {
      throw new IdInvalidException("Bulk AI chỉ hỗ trợ action SIMILAR");
    }

    List<UUID> uniqueIds = new ArrayList<>(new LinkedHashSet<>(request.getIds()));
    ResBulkQuestionBankAiDTO result = new ResBulkQuestionBankAiDTO();
    result.setRequested(uniqueIds.size());

    ReqQuestionBankAiSimilarDTO similarReq = new ReqQuestionBankAiSimilarDTO();
    similarReq.setQuestionCount(request.getQuestionCount() > 0 ? request.getQuestionCount() : 1);

    for (UUID id : uniqueIds) {
      try {
        ResQuestionBankAiTaskDTO task = createSimilarTask(id, similarReq);
        result.getTaskIds().add(task.getTaskId());
      } catch (Exception e) {
        ResBulkQuestionBankAiDTO.BulkAiError err = new ResBulkQuestionBankAiDTO.BulkAiError();
        err.setQuestionId(id);
        err.setMessage(e.getMessage() != null ? e.getMessage() : "Không tạo được tác vụ");
        result.getErrors().add(err);
      }
    }

    aiAccessSupport.requireStaffUser();
    activityLogService.log(
        ActivityLogWriteContext.of(
                ActivityLogSeverityEnum.INFO,
                ActivityLogModuleEnum.AI,
                ActivityLogActionEnum.AI_GEN_TASK_CREATED,
                "Bulk bank AI similar: " + result.getTaskIds().size() + "/" + uniqueIds.size())
            .userId(aiAccessSupport.currentUserId())
            .put("action", QuestionBankAiActionEnum.SIMILAR.name())
            .put("requested", uniqueIds.size())
            .put("taskCount", result.getTaskIds().size())
            .put("errorCount", result.getErrors().size()));

    return result;
  }

  private ReqCreateQuestionGenTaskDTO buildBaseInput(
      ResQuestionDTO source, int questionCount, QuestionBankAiActionEnum action) {
    ReqCreateQuestionGenTaskDTO input = new ReqCreateQuestionGenTaskDTO();
    input.setQuestionCount(questionCount);
    input.setQuestionTypes(List.of(source.getQuestionType()));
    input.setDifficulty(source.getDifficulty() != null ? source.getDifficulty() : 2);
    input.setPromptLang(source.getPromptLang() != null && !source.getPromptLang().isBlank() ? source.getPromptLang() : "en");
    input.setReadingSubQuestionCount(resolveReadingSubCount(source));
    input.setBankAiAction(action.name());
    if (source.getCategoryId() != null) {
      input.setCategoryId(source.getCategoryId());
    }
    if (source.getTopic() != null && !source.getTopic().isBlank()) {
      input.setTopic(source.getTopic().trim());
    }
    return input;
  }

  private int resolveReadingSubCount(ResQuestionDTO source) {
    if (source.getQuestionType() != QuestionTypeEnum.READING_COMPREHENSION) {
      if (source.getQuestionType() == QuestionTypeEnum.GAP_FILL_MCQ) {
        return resolveGapBlankCount(source.getContentJson());
      }
      return 4;
    }
    int subs = countReadingSubQuestions(source.getContentJson());
    return subs > 0 ? subs : 4;
  }

  private int countReadingSubQuestions(String contentJson) {
    if (contentJson == null || contentJson.isBlank()) {
      return 0;
    }
    try {
      JsonNode root = objectMapper.readTree(contentJson);
      JsonNode subArr = root.path("subQuestions");
      if (subArr.isArray() && !subArr.isEmpty()) {
        return subArr.size();
      }
    } catch (JsonProcessingException ignored) {
      // fall through
    }
    return 0;
  }

  private int resolveGapBlankCount(String contentJson) {
    if (contentJson == null || contentJson.isBlank()) {
      return 4;
    }
    try {
      JsonNode blanks = objectMapper.readTree(contentJson).path("blanks");
      if (blanks.isArray() && !blanks.isEmpty()) {
        return blanks.size();
      }
    } catch (JsonProcessingException ignored) {
      // fall through
    }
    return 4;
  }

  private void requireSupportedType(QuestionTypeEnum type) throws IdInvalidException {
    if (type == null) {
      throw new IdInvalidException("Câu hỏi thiếu loại");
    }
    List<String> allowed = aiAccessSupport.parseSupportedGenTypes(supportedGenTypesCsv);
    if (!allowed.contains(type.name())) {
      throw new IdInvalidException("Loại câu hỏi chưa hỗ trợ AI: " + type);
    }
    if (!handlerRegistry.supports(type)) {
      throw new IdInvalidException("Loại câu hỏi chưa có handler: " + type);
    }
  }

  private static ResQuestionBankAiTaskDTO toBankTaskDto(
      ResCreateAiTaskDTO created,
      UUID sourceId,
      UUID targetId,
      QuestionBankAiActionEnum action) {
    ResQuestionBankAiTaskDTO dto = new ResQuestionBankAiTaskDTO();
    dto.setTaskId(created.getTaskId());
    dto.setStatus(created.getStatus() != null ? created.getStatus() : AiTaskStatusEnum.PENDING);
    dto.setSourceQuestionId(sourceId);
    dto.setTargetQuestionId(targetId);
    dto.setAction(action);
    return dto;
  }
}
