package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqCreateQuestionGenTaskDTO;
import com.courseenglish.api.domain.response.ResAiTaskDTO;
import com.courseenglish.api.domain.response.ResCreateAiTaskDTO;
import com.courseenglish.api.service.AiTaskService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
