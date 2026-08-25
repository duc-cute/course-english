package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqStartExamAttemptDTO;
import com.courseenglish.api.domain.request.ReqSubmitExamAttemptDTO;
import com.courseenglish.api.domain.response.ResExamAttemptDTO;
import com.courseenglish.api.domain.response.ResStudentExamAssignmentDTO;
import com.courseenglish.api.service.ExamAssignmentService;
import com.courseenglish.api.service.ExamAttemptService;
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
public class StudentExamController {

    private final ExamAssignmentService assignmentService;
    private final ExamAttemptService attemptService;

    public StudentExamController(
            ExamAssignmentService assignmentService, ExamAttemptService attemptService) {
        this.assignmentService = assignmentService;
        this.attemptService = attemptService;
    }

    @GetMapping("/student/exams/assigned")
    @ApiMessage("List exam papers assigned to current student")
    public ResponseEntity<List<ResStudentExamAssignmentDTO>> listAssigned(
            @RequestParam(required = false) UUID classroomId) throws IdInvalidException {
        return ResponseEntity.ok(assignmentService.listAssignedForCurrentStudent(classroomId));
    }

    @GetMapping("/student/exams/assigned/{assignmentId}")
    @ApiMessage("Get assigned exam detail for current student")
    public ResponseEntity<ResStudentExamAssignmentDTO> getAssigned(
            @PathVariable UUID assignmentId,
            @RequestParam(defaultValue = "true") boolean includeSections)
            throws IdInvalidException {
        return ResponseEntity.ok(
                assignmentService.getAssignedForCurrentStudent(assignmentId, includeSections));
    }

    @PostMapping("/student/exams/attempts/start")
    @ApiMessage("Start exam attempt")
    public ResponseEntity<ResExamAttemptDTO> start(@Valid @RequestBody ReqStartExamAttemptDTO request)
            throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(attemptService.start(request));
    }

    @PostMapping("/student/exams/attempts/submit")
    @ApiMessage("Submit exam attempt")
    public ResponseEntity<ResExamAttemptDTO> submit(@Valid @RequestBody ReqSubmitExamAttemptDTO request)
            throws IdInvalidException {
        return ResponseEntity.ok(attemptService.submit(request));
    }
}
