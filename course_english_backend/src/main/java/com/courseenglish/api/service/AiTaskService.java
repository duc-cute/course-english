package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqCreateExamPaperGenTaskDTO;
import com.courseenglish.api.domain.request.ReqCreateQuestionGenTaskDTO;
import com.courseenglish.api.domain.request.ReqCreateVocabularySetGenTaskDTO;
import com.courseenglish.api.domain.request.ReqUpdateAiTaskDraftDTO;
import com.courseenglish.api.domain.response.ResAiQuestionGenPromptPreviewDTO;
import com.courseenglish.api.domain.response.ResAiTaskDTO;
import com.courseenglish.api.domain.response.ResCreateAiTaskDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.ai.AiQuestionGenPromptPreviewService;
import com.courseenglish.api.service.ai.AiTaskCommandService;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AiTaskService {

  private final AiTaskCommandService aiTaskCommandService;
  private final AiQuestionGenPromptPreviewService promptPreviewService;

  public AiTaskService(
      AiTaskCommandService aiTaskCommandService,
      AiQuestionGenPromptPreviewService promptPreviewService) {
    this.aiTaskCommandService = aiTaskCommandService;
    this.promptPreviewService = promptPreviewService;
  }

  public ResCreateAiTaskDTO createQuestionGenerationTask(ReqCreateQuestionGenTaskDTO request)
      throws IdInvalidException {
    return aiTaskCommandService.createQuestionGenerationTask(request);
  }

  public ResCreateAiTaskDTO createExamPaperGenerationTask(ReqCreateExamPaperGenTaskDTO request)
      throws IdInvalidException {
    return aiTaskCommandService.createExamPaperGenerationTask(request);
  }

  public ResCreateAiTaskDTO createVocabularySetGenerationTask(ReqCreateVocabularySetGenTaskDTO request)
      throws IdInvalidException {
    return aiTaskCommandService.createVocabularySetGenerationTask(request);
  }

  public ResAiQuestionGenPromptPreviewDTO previewQuestionGenPrompt(ReqCreateQuestionGenTaskDTO request)
      throws IdInvalidException {
    return promptPreviewService.preview(request);
  }

  public ResultPaginationDTO listQuestionGenHistory(int page, int pageSize) throws IdInvalidException {
    return aiTaskCommandService.listQuestionGenHistory(page, pageSize);
  }

  public ResAiTaskDTO getTask(UUID taskId) throws IdInvalidException {
    return aiTaskCommandService.getTask(taskId);
  }

  public void reportClientPollTimeout(UUID taskId) throws IdInvalidException {
    aiTaskCommandService.reportClientPollTimeout(taskId);
  }

  public ResAiTaskDTO updateTaskDraft(UUID taskId, ReqUpdateAiTaskDraftDTO request)
      throws IdInvalidException {
    return aiTaskCommandService.updateTaskDraft(taskId, request);
  }
}
