package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.AiDocument;
import com.courseenglish.api.domain.request.ReqCreateQuestionGenTaskDTO;
import com.courseenglish.api.domain.response.ResAiQuestionGenPromptPreviewDTO;
import com.courseenglish.api.domain.response.ResPromptBatchPreviewDTO;
import com.courseenglish.api.service.ai.question.AiQuestionBatchPlanner;
import com.courseenglish.api.service.ai.question.AiQuestionBatchPlanner.BatchSpec;
import com.courseenglish.api.service.ai.question.AiQuestionPromptAssembler;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AiQuestionGenPromptPreviewService {

  private final AiDocumentService aiDocumentService;
  private final AiAccessSupport aiAccessSupport;
  private final AiQuestionBatchPlanner batchPlanner;
  private final AiQuestionPromptAssembler promptAssembler;

  public AiQuestionGenPromptPreviewService(
      AiDocumentService aiDocumentService,
      AiAccessSupport aiAccessSupport,
      AiQuestionBatchPlanner batchPlanner,
      AiQuestionPromptAssembler promptAssembler) {
    this.aiDocumentService = aiDocumentService;
    this.aiAccessSupport = aiAccessSupport;
    this.batchPlanner = batchPlanner;
    this.promptAssembler = promptAssembler;
  }

  public ResAiQuestionGenPromptPreviewDTO preview(ReqCreateQuestionGenTaskDTO request)
      throws IdInvalidException {
    aiAccessSupport.requireAiEnabled();
    aiAccessSupport.requireStaffUser();
    UUID userId = aiAccessSupport.currentUserId();

    boolean topicMode = request.getTopic() != null && !request.getTopic().isBlank();
    String excerpt = resolveExcerpt(request, userId, topicMode);

    Map<QuestionTypeEnum, Integer> quotas = normalizeTypeQuotas(request.getTypeQuotas());
    List<BatchSpec> specs;
    int totalCount;

    if (!quotas.isEmpty()) {
      specs = batchPlanner.planFromQuotas(quotas);
      totalCount = quotas.values().stream().mapToInt(Integer::intValue).sum();
    } else if (topicMode) {
      throw new IdInvalidException("Chế độ topic cần typeQuotas");
    } else {
      totalCount = request.getQuestionCount();
      List<QuestionTypeEnum> types = request.getQuestionTypes();
      if (types == null || types.isEmpty()) {
        throw new IdInvalidException("Chọn ít nhất một loại câu hỏi");
      }
      specs = batchPlanner.plan(totalCount, types);
    }

    if (specs.isEmpty()) {
      throw new IdInvalidException("Không có batch hợp lệ để preview prompt");
    }

    int difficulty = request.getDifficulty() != null ? request.getDifficulty() : 2;
    String promptLang = request.getPromptLang() != null ? request.getPromptLang() : "en";
    int readingSubQuestionCount =
        request.getReadingSubQuestionCount() != null ? request.getReadingSubQuestionCount() : 4;

    ResAiQuestionGenPromptPreviewDTO dto = new ResAiQuestionGenPromptPreviewDTO();
    dto.setTopicMode(topicMode);
    dto.setSourceExcerpt(excerpt);
    dto.setTotalQuestionCount(totalCount);

    List<ResPromptBatchPreviewDTO> batches = new ArrayList<>();
    for (BatchSpec spec : specs) {
      ResPromptBatchPreviewDTO batch = new ResPromptBatchPreviewDTO();
      batch.setQuestionType(spec.type());
      batch.setCount(spec.count());
      batch.setSystemPrompt(promptAssembler.buildSystemPromptForType(spec.type(), topicMode));
      batch.setUserPrompt(
          promptAssembler.buildUserPrompt(
              excerpt,
              spec.count(),
              List.of(spec.type()),
              difficulty,
              promptLang,
              topicMode,
              readingSubQuestionCount));
      batches.add(batch);
    }
    dto.setBatches(batches);
    return dto;
  }

  private String resolveExcerpt(ReqCreateQuestionGenTaskDTO request, UUID userId, boolean topicMode)
      throws IdInvalidException {
    if (topicMode) {
      return AiDocumentService.buildTopicBriefText(
          request.getTopic().trim(),
          request.getGrade(),
          request.getLanguageLevel(),
          request.getAdditionalInstructions());
    }
    if (request.getDocumentId() == null) {
      throw new IdInvalidException("Thiếu documentId hoặc topic");
    }
    AiDocument document = aiDocumentService.requireReadyDocument(request.getDocumentId(), userId);
    return document.getExtractedText();
  }

  private Map<QuestionTypeEnum, Integer> normalizeTypeQuotas(Map<QuestionTypeEnum, Integer> raw) {
    if (raw == null || raw.isEmpty()) {
      return Map.of();
    }
    Map<QuestionTypeEnum, Integer> out = new LinkedHashMap<>();
    for (Map.Entry<QuestionTypeEnum, Integer> entry : raw.entrySet()) {
      if (entry.getKey() == null || entry.getValue() == null || entry.getValue() < 1) {
        continue;
      }
      out.put(entry.getKey(), entry.getValue());
    }
    return out;
  }
}
