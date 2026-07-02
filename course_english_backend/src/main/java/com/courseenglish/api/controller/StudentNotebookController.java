package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqCreateNotebookEntryDTO;
import com.courseenglish.api.domain.request.ReqSearchNotebookEntryDTO;
import com.courseenglish.api.domain.response.ResNotebookEntryDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.StudentNotebookService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/student/notebook")
public class StudentNotebookController {

    private final StudentNotebookService studentNotebookService;

    public StudentNotebookController(StudentNotebookService studentNotebookService) {
        this.studentNotebookService = studentNotebookService;
    }

    @PostMapping("/search")
    @ApiMessage("Search student notebook entries")
    public ResponseEntity<ResultPaginationDTO> search(@RequestBody(required = false) ReqSearchNotebookEntryDTO req)
            throws IdInvalidException {
        return ResponseEntity.ok(studentNotebookService.search(req));
    }

    @PostMapping("")
    @ApiMessage("Save notebook entry")
    public ResponseEntity<ResNotebookEntryDTO> save(@Valid @RequestBody ReqCreateNotebookEntryDTO request)
            throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentNotebookService.save(request));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete notebook entry")
    public ResponseEntity<Void> delete(@PathVariable UUID id) throws IdInvalidException {
        studentNotebookService.delete(id);
        return ResponseEntity.ok(null);
    }
}
