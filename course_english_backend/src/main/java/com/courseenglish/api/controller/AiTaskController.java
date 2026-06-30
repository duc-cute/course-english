package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqCreateExamPaperGenTaskDTO;
import com.courseenglish.api.domain.request.ReqCreateQuestionGenTaskDTO;
import com.courseenglish.api.domain.request.ReqCreateVocabularySetGenTaskDTO;
import com.courseenglish.api.domain.request.ReqUpdateAiTaskDraftDTO;
import com.courseenglish.api.domain.response.ResAiQuestionGenPromptPreviewDTO;
import com.courseenglish.api.domain.response.ResAiTaskDTO;
import com.courseenglish.api.domain.response.ResCreateAiTaskDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.AiTaskService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/tasks")
public class AiTaskController {

  private final AiTaskService aiTaskService;

  public AiTaskController(AiTaskService aiTaskService) {
    this.aiTaskService = aiTaskService;
  }

  @PostMapping("/question-generation")
  @ApiMessage("Create AI question generation task")
  public ResponseEntity<ResCreateAiTaskDTO> createQuestionGeneration(
      @Valid @RequestBody ReqCreateQuestionGenTaskDTO request) throws IdInvalidException {
    return ResponseEntity.status(HttpStatus.ACCEPTED).body(aiTaskService.createQuestionGenerationTask(request));
  }

  @PostMapping("/exam-paper-generation")
  @ApiMessage("Create AI exam paper generation task from section specs")
  public ResponseEntity<ResCreateAiTaskDTO> createExamPaperGeneration(
      @Valid @RequestBody ReqCreateExamPaperGenTaskDTO request) throws IdInvalidException {
    return ResponseEntity.status(HttpStatus.ACCEPTED).body(aiTaskService.createExamPaperGenerationTask(request));
  }

  @PostMapping("/vocabulary-set-generation")
  @ApiMessage("Create AI vocabulary set generation task")
  public ResponseEntity<ResCreateAiTaskDTO> createVocabularySetGeneration(
      @Valid @RequestBody ReqCreateVocabularySetGenTaskDTO request) throws IdInvalidException {
    return ResponseEntity.status(HttpStatus.ACCEPTED).body(aiTaskService.createVocabularySetGenerationTask(request));
  }

  @PostMapping("/question-generation/prompt-preview")
  @ApiMessage("Preview AI question generation prompts")
  public ResponseEntity<ResAiQuestionGenPromptPreviewDTO> previewQuestionGenPrompt(
      @Valid @RequestBody ReqCreateQuestionGenTaskDTO request) throws IdInvalidException {
    return ResponseEntity.ok(aiTaskService.previewQuestionGenPrompt(request));
  }

  @GetMapping("/history")
  @ApiMessage("List AI question generation history")
  public ResponseEntity<ResultPaginationDTO> listHistory(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "15") int pageSize) throws IdInvalidException {
    return ResponseEntity.ok(aiTaskService.listQuestionGenHistory(page, pageSize));
  }

  @GetMapping("/{id}")
  @ApiMessage("Get AI task status")
  public ResponseEntity<ResAiTaskDTO> getById(@PathVariable UUID id) throws IdInvalidException {
    return ResponseEntity.ok(aiTaskService.getTask(id));
  }

  @PostMapping("/{id}/client-poll-timeout")
  @ApiMessage("Report frontend poll timeout for AI task")
  public ResponseEntity<Void> reportClientPollTimeout(@PathVariable UUID id) throws IdInvalidException {
    aiTaskService.reportClientPollTimeout(id);
    return ResponseEntity.ok().build();
  }

  @PatchMapping("/{id}/draft")
  @ApiMessage("Update AI question generation draft after preview edits")
  public ResponseEntity<ResAiTaskDTO> updateDraft(
      @PathVariable UUID id,
      @Valid @RequestBody ReqUpdateAiTaskDraftDTO request) throws IdInvalidException {
    return ResponseEntity.ok(aiTaskService.updateTaskDraft(id, request));
  }
}
