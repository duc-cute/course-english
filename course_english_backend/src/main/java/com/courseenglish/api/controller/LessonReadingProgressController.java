package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqUpsertLessonReadingProgressDTO;
import com.courseenglish.api.domain.response.ResLessonReadingProgressDTO;
import com.courseenglish.api.service.LessonReadingProgressService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/lesson-reading-progress")
public class LessonReadingProgressController {

    private final LessonReadingProgressService progressService;

    public LessonReadingProgressController(LessonReadingProgressService progressService) {
        this.progressService = progressService;
    }

    @PutMapping("/{lessonId}")
    @ApiMessage("Upsert lesson reading progress")
    public ResponseEntity<ResLessonReadingProgressDTO> upsert(
            @PathVariable UUID lessonId,
            @Valid @RequestBody ReqUpsertLessonReadingProgressDTO request) throws IdInvalidException {
        return ResponseEntity.ok(progressService.upsert(lessonId, request));
    }

    @GetMapping("/continue")
    @ApiMessage("Get continue learning progress")
    public ResponseEntity<ResLessonReadingProgressDTO> getContinue() throws IdInvalidException {
        ResLessonReadingProgressDTO dto = progressService.getContinue();
        if (dto == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{lessonId}")
    @ApiMessage("Get lesson reading progress")
    public ResponseEntity<ResLessonReadingProgressDTO> getByLesson(@PathVariable UUID lessonId)
            throws IdInvalidException {
        ResLessonReadingProgressDTO dto = progressService.getByLesson(lessonId);
        if (dto == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(dto);
    }
}
