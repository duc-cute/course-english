package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqCreateVocabularyPracticeAttemptDTO;
import com.courseenglish.api.domain.request.ReqVocabularyPracticeSummaryDTO;
import com.courseenglish.api.domain.response.ResVocabularyPracticeAttemptDTO;
import com.courseenglish.api.domain.response.ResVocabularyPracticeSummaryItemDTO;
import com.courseenglish.api.service.VocabularyPracticeAttemptService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/student/vocab/practice-attempts")
public class VocabularyPracticeAttemptController {

    private final VocabularyPracticeAttemptService attemptService;

    public VocabularyPracticeAttemptController(VocabularyPracticeAttemptService attemptService) {
        this.attemptService = attemptService;
    }

    @PostMapping("")
    @ApiMessage("Submit vocabulary practice attempt")
    public ResponseEntity<ResVocabularyPracticeAttemptDTO> create(
            @Valid @RequestBody ReqCreateVocabularyPracticeAttemptDTO request) throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(attemptService.create(request));
    }

    @PostMapping("/summary")
    @ApiMessage("Batch practice summary for vocabulary sets")
    public ResponseEntity<List<ResVocabularyPracticeSummaryItemDTO>> summary(
            @Valid @RequestBody ReqVocabularyPracticeSummaryDTO request) throws IdInvalidException {
        return ResponseEntity.ok(attemptService.getSummary(request));
    }

    @GetMapping("/latest")
    @ApiMessage("Get latest vocabulary practice attempt for set")
    public ResponseEntity<ResVocabularyPracticeAttemptDTO> getLatest(
            @RequestParam UUID vocabularySetId) throws IdInvalidException {
        ResVocabularyPracticeAttemptDTO dto = attemptService.getLatest(vocabularySetId);
        if (dto == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/best")
    @ApiMessage("Get best vocabulary practice attempt for set")
    public ResponseEntity<ResVocabularyPracticeAttemptDTO> getBest(
            @RequestParam UUID vocabularySetId) throws IdInvalidException {
        ResVocabularyPracticeAttemptDTO dto = attemptService.getBest(vocabularySetId);
        if (dto == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("")
    @ApiMessage("List vocabulary practice attempts for set")
    public ResponseEntity<List<ResVocabularyPracticeAttemptDTO>> list(
            @RequestParam UUID vocabularySetId) throws IdInvalidException {
        return ResponseEntity.ok(attemptService.listBySet(vocabularySetId));
    }
}
