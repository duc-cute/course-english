package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqBulkQuestionDTO;
import com.courseenglish.api.domain.request.ReqExportQuestionsDTO;
import com.courseenglish.api.domain.request.ReqQuestionDTO;
import com.courseenglish.api.domain.request.ReqSearchQuestionDTO;
import com.courseenglish.api.domain.response.ResBulkQuestionResultDTO;
import com.courseenglish.api.domain.response.ResQuestionExportDTO;
import com.courseenglish.api.domain.response.ResQuestionCategoryDTO;
import com.courseenglish.api.domain.response.ResQuestionDTO;
import com.courseenglish.api.domain.response.ResQuestionStatsDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.QuestionService;
import com.courseenglish.api.service.ai.question.QuestionAiExplainService;
import com.courseenglish.api.domain.response.ResQuestionAiExplainDTO;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/questions")
public class QuestionController {

    private final QuestionService questionService;
    private final QuestionAiExplainService questionAiExplainService;

    public QuestionController(
            QuestionService questionService, QuestionAiExplainService questionAiExplainService) {
        this.questionService = questionService;
        this.questionAiExplainService = questionAiExplainService;
    }

    @PostMapping("/search")
    @ApiMessage("Search questions in bank")
    public ResponseEntity<ResultPaginationDTO> search(@RequestBody(required = false) ReqSearchQuestionDTO req) {
        return ResponseEntity.ok(questionService.search(req));
    }

    @GetMapping("/categories")
    @ApiMessage("List question categories")
    public ResponseEntity<List<ResQuestionCategoryDTO>> listCategories() {
        return ResponseEntity.ok(questionService.listCategories());
    }

    @GetMapping("/stats")
    @ApiMessage("Question bank statistics")
    public ResponseEntity<ResQuestionStatsDTO> stats() {
        return ResponseEntity.ok(questionService.getStats());
    }

    @PostMapping("/bulk")
    @ApiMessage("Bulk update, duplicate or delete questions")
    public ResponseEntity<ResBulkQuestionResultDTO> bulk(@Valid @RequestBody ReqBulkQuestionDTO request)
            throws IdInvalidException {
        return ResponseEntity.ok(questionService.bulk(request));
    }

    @PostMapping("/export")
    @ApiMessage("Export questions by ids")
    public ResponseEntity<ResQuestionExportDTO> export(@Valid @RequestBody ReqExportQuestionsDTO request)
            throws IdInvalidException {
        return ResponseEntity.ok(questionService.export(request));
    }

    @PostMapping("/{id}/ai/explain")
    @ApiMessage("Generate Vietnamese explanation for a bank question")
    public ResponseEntity<ResQuestionAiExplainDTO> explainAnswer(@PathVariable UUID id)
            throws IdInvalidException {
        return ResponseEntity.ok(questionAiExplainService.explain(id));
    }

    @GetMapping("/{id}")
    @ApiMessage("Get question by id")
    public ResponseEntity<ResQuestionDTO> getById(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(questionService.getById(id));
    }

    @PostMapping("")
    @ApiMessage("Create question")
    public ResponseEntity<ResQuestionDTO> create(@Valid @RequestBody ReqQuestionDTO request)
            throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.create(request));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update question")
    public ResponseEntity<ResQuestionDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody ReqQuestionDTO request) throws IdInvalidException {
        return ResponseEntity.ok(questionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete question")
    public ResponseEntity<Void> delete(@PathVariable UUID id) throws IdInvalidException {
        questionService.delete(id);
        return ResponseEntity.ok(null);
    }
}
