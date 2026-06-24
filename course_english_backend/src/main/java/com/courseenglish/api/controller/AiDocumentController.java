package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqCreateTextDocumentDTO;
import com.courseenglish.api.domain.response.ResAiDocumentDTO;
import com.courseenglish.api.service.ai.AiDocumentService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/documents")
public class AiDocumentController {

  private final AiDocumentService aiDocumentService;

  public AiDocumentController(AiDocumentService aiDocumentService) {
    this.aiDocumentService = aiDocumentService;
  }

  @PostMapping
  @ApiMessage("Upload AI document")
  public ResponseEntity<ResAiDocumentDTO> upload(@RequestParam("file") MultipartFile file)
      throws IdInvalidException {
    return ResponseEntity.status(HttpStatus.CREATED).body(aiDocumentService.upload(file));
  }

  @PostMapping("/text")
  @ApiMessage("Create AI document from pasted text")
  public ResponseEntity<ResAiDocumentDTO> createFromText(
      @Valid @RequestBody ReqCreateTextDocumentDTO request) throws IdInvalidException {
    return ResponseEntity.status(HttpStatus.CREATED).body(aiDocumentService.createFromText(request));
  }

  @GetMapping("/{id}")
  @ApiMessage("Get AI document metadata")
  public ResponseEntity<ResAiDocumentDTO> getById(@PathVariable UUID id) throws IdInvalidException {
    return ResponseEntity.ok(aiDocumentService.getById(id));
  }
}
