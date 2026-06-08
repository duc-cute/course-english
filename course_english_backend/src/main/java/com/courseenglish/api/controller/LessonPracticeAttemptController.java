package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqCreateLessonPracticeAttemptDTO;
import com.courseenglish.api.domain.request.ReqLessonPracticeSummaryDTO;
import com.courseenglish.api.domain.response.ResLessonPracticeAttemptDTO;
import com.courseenglish.api.domain.response.ResLessonPracticeSummaryItemDTO;
import com.courseenglish.api.service.LessonPracticeAttemptService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/lesson-practice-attempts")
public class LessonPracticeAttemptController {

    private final LessonPracticeAttemptService attemptService;

    public LessonPracticeAttemptController(LessonPracticeAttemptService attemptService) {
        this.attemptService = attemptService;
    }

    @PostMapping("")
    @ApiMessage("Submit lesson practice attempt")
    public ResponseEntity<ResLessonPracticeAttemptDTO> create(
            @Valid @RequestBody ReqCreateLessonPracticeAttemptDTO request) throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(attemptService.create(request));
    }

    @PostMapping("/summary")
    @ApiMessage("Batch practice summary for lessons")
    public ResponseEntity<List<ResLessonPracticeSummaryItemDTO>> summary(
            @Valid @RequestBody ReqLessonPracticeSummaryDTO request) throws IdInvalidException {
        return ResponseEntity.ok(attemptService.getSummary(request));
    }

    @GetMapping("/lessons/{lessonId}/latest")
    @ApiMessage("Get latest practice attempt for lesson")
    public ResponseEntity<ResLessonPracticeAttemptDTO> getLatest(@PathVariable UUID lessonId)
            throws IdInvalidException {
        ResLessonPracticeAttemptDTO dto = attemptService.getLatest(lessonId);
        if (dto == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/lessons/{lessonId}/best")
    @ApiMessage("Get best practice attempt for lesson")
    public ResponseEntity<ResLessonPracticeAttemptDTO> getBest(@PathVariable UUID lessonId)
            throws IdInvalidException {
        ResLessonPracticeAttemptDTO dto = attemptService.getBest(lessonId);
        if (dto == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/lessons/{lessonId}")
    @ApiMessage("List practice attempts for lesson")
    public ResponseEntity<List<ResLessonPracticeAttemptDTO>> list(@PathVariable UUID lessonId)
            throws IdInvalidException {
        return ResponseEntity.ok(attemptService.listByLesson(lessonId));
    }
}
