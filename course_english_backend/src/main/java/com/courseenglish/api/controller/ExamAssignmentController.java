package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqCreateExamAssignmentDTO;
import com.courseenglish.api.domain.request.ReqSearchExamAssignmentDTO;
import com.courseenglish.api.domain.response.ResExamAssignmentDTO;
import com.courseenglish.api.domain.response.ResExamClassScoreDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.ExamAssignmentService;
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
public class ExamAssignmentController {

    private final ExamAssignmentService assignmentService;

    public ExamAssignmentController(ExamAssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @PostMapping("/exam-assignments")
    @ApiMessage("Assign exam paper to classroom")
    public ResponseEntity<ResExamAssignmentDTO> create(
            @Valid @RequestBody ReqCreateExamAssignmentDTO request) throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(assignmentService.create(request));
    }

    @PostMapping("/exam-assignments/search")
    @ApiMessage("Search exam paper assignments")
    public ResponseEntity<ResultPaginationDTO> search(
            @RequestBody(required = false) ReqSearchExamAssignmentDTO request)
            throws IdInvalidException {
        return ResponseEntity.ok(assignmentService.search(request));
    }

    @DeleteMapping("/exam-assignments/{id}")
    @ApiMessage("Cancel exam paper assignment")
    public ResponseEntity<Void> cancel(@PathVariable UUID id) throws IdInvalidException {
        assignmentService.cancel(id);
        return ResponseEntity.ok(null);
    }

    @GetMapping("/exam-assignments/{id}/scores")
    @ApiMessage("List class scores for exam assignment")
    public ResponseEntity<List<ResExamClassScoreDTO>> scores(@PathVariable UUID id)
            throws IdInvalidException {
        return ResponseEntity.ok(assignmentService.listClassScores(id));
    }
}
