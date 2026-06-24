package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqCreateQuestionGenTaskDTO;
import com.courseenglish.api.domain.request.ReqUpdateAiTaskDraftDTO;
import com.courseenglish.api.domain.response.ResAiTaskDTO;
import com.courseenglish.api.domain.response.ResCreateAiTaskDTO;
import com.courseenglish.api.service.ai.AiTaskCommandService;
import com.courseenglish.api.util.error.IdInvalidException;import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AiTaskService {

  private final AiTaskCommandService aiTaskCommandService;

  public AiTaskService(AiTaskCommandService aiTaskCommandService) {
    this.aiTaskCommandService = aiTaskCommandService;
  }

  public ResCreateAiTaskDTO createQuestionGenerationTask(ReqCreateQuestionGenTaskDTO request)
      throws IdInvalidException {
    return aiTaskCommandService.createQuestionGenerationTask(request);
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
