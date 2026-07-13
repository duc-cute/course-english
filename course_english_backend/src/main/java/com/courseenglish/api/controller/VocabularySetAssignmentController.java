package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqSearchVocabularySetAssignmentDTO;
import com.courseenglish.api.domain.request.ReqVocabularySetAssignmentDTO;
import com.courseenglish.api.domain.response.ResVocabularySetAssignmentDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.VocabularySetAssignmentService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class VocabularySetAssignmentController {

    private final VocabularySetAssignmentService assignmentService;

    public VocabularySetAssignmentController(VocabularySetAssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @PostMapping("/vocabulary-set-assignments")
    @ApiMessage("Assign vocabulary set to classroom")
    public ResponseEntity<ResVocabularySetAssignmentDTO> create(
            @Valid @RequestBody ReqVocabularySetAssignmentDTO request) throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(assignmentService.create(request));
    }

    @PostMapping("/vocabulary-set-assignments/search")
    @ApiMessage("Search vocabulary set assignments")
    public ResponseEntity<ResultPaginationDTO> search(
            @RequestBody(required = false) ReqSearchVocabularySetAssignmentDTO request)
            throws IdInvalidException {
        return ResponseEntity.ok(assignmentService.search(request));
    }

    @DeleteMapping("/vocabulary-set-assignments/{id}")
    @ApiMessage("Cancel vocabulary set assignment")
    public ResponseEntity<Void> cancel(@PathVariable UUID id) throws IdInvalidException {
        assignmentService.cancel(id);
        return ResponseEntity.ok(null);
    }

    @GetMapping("/student/vocab/assigned")
    @ApiMessage("List vocabulary sets assigned to current student")
    public ResponseEntity<List<ResVocabularySetAssignmentDTO>> listAssigned(
            @RequestParam(required = false) UUID classroomId) throws IdInvalidException {
        return ResponseEntity.ok(assignmentService.listAssignedForCurrentStudent(classroomId));
    }

    @GetMapping("/student/vocab/assigned/{assignmentId}")
    @ApiMessage("Get assigned vocabulary set detail for current student")
    public ResponseEntity<ResVocabularySetAssignmentDTO> getAssigned(@PathVariable UUID assignmentId)
            throws IdInvalidException {
        return ResponseEntity.ok(assignmentService.getAssignedForCurrentStudent(assignmentId));
    }
}
