package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqExamPaperDTO;
import com.courseenglish.api.domain.request.ReqExamPaperOutlineDTO;
import com.courseenglish.api.domain.request.ReqExamSectionSlicesDTO;
import com.courseenglish.api.domain.request.ReqGenerateReadingSectionDTO;
import com.courseenglish.api.domain.request.ReqParseReadingBlockDTO;
import com.courseenglish.api.domain.request.ReqReorderExamSectionsDTO;
import com.courseenglish.api.domain.request.ReqSearchExamPaperDTO;
import com.courseenglish.api.domain.response.ResExamPaperDTO;
import com.courseenglish.api.domain.response.ResExamPaperOutlineDTO;
import com.courseenglish.api.domain.response.ResExamSectionSlicesDTO;
import com.courseenglish.api.domain.response.ResParseReadingBlockDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.ExamPaperService;
import com.courseenglish.api.service.ai.AiExamPaperOutlineService;
import com.courseenglish.api.service.ai.AiReadingImportService;
import com.courseenglish.api.service.ai.ExamSectionSlicesFacade;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/exam-papers")
public class ExamPaperController {

    private final ExamPaperService examPaperService;
    private final AiExamPaperOutlineService aiExamPaperOutlineService;
    private final AiReadingImportService aiReadingImportService;
    private final ExamSectionSlicesFacade examSectionSlicesFacade;

    public ExamPaperController(
            ExamPaperService examPaperService,
            AiExamPaperOutlineService aiExamPaperOutlineService,
            AiReadingImportService aiReadingImportService,
            ExamSectionSlicesFacade examSectionSlicesFacade) {
        this.examPaperService = examPaperService;
        this.aiExamPaperOutlineService = aiExamPaperOutlineService;
        this.aiReadingImportService = aiReadingImportService;
        this.examSectionSlicesFacade = examSectionSlicesFacade;
    }

    @PostMapping("/search")
    @ApiMessage("Search exam papers")
    public ResponseEntity<ResultPaginationDTO> search(@RequestBody(required = false) ReqSearchExamPaperDTO req) {
        return ResponseEntity.ok(examPaperService.search(req));
    }

    @GetMapping("/{id}")
    @ApiMessage("Get exam paper by id")
    public ResponseEntity<ResExamPaperDTO> getById(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(examPaperService.getById(id));
    }

    @PostMapping("")
    @ApiMessage("Create exam paper")
    public ResponseEntity<ResExamPaperDTO> create(@Valid @RequestBody ReqExamPaperDTO request)
            throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(examPaperService.create(request));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update exam paper")
    public ResponseEntity<ResExamPaperDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody ReqExamPaperDTO request) throws IdInvalidException {
        return ResponseEntity.ok(examPaperService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete exam paper")
    public ResponseEntity<Void> delete(@PathVariable UUID id) throws IdInvalidException {
        examPaperService.delete(id);
        return ResponseEntity.ok(null);
    }

    @PatchMapping("/{id}/sections/reorder")
    @ApiMessage("Reorder exam sections")
    public ResponseEntity<ResExamPaperDTO> reorderSections(
            @PathVariable UUID id,
            @Valid @RequestBody ReqReorderExamSectionsDTO request) throws IdInvalidException {
        return ResponseEntity.ok(examPaperService.reorderSections(id, request));
    }

    @PostMapping("/ai/outline")
    @ApiMessage("Analyze document and infer exam paper section outline")
    public ResponseEntity<ResExamPaperOutlineDTO> analyzeOutline(
            @Valid @RequestBody ReqExamPaperOutlineDTO request) throws IdInvalidException {
        return ResponseEntity.ok(aiExamPaperOutlineService.buildOutline(request));
    }

    @PostMapping("/ai/section-slices")
    @ApiMessage("Recalculate per-section document excerpt slices for preview")
    public ResponseEntity<ResExamSectionSlicesDTO> recalcSectionSlices(
            @Valid @RequestBody ReqExamSectionSlicesDTO request) throws IdInvalidException {
        return ResponseEntity.ok(examSectionSlicesFacade.recalculate(request));
    }

    @PostMapping("/ai/reading-parse")
    @ApiMessage("Parse pasted reading block into passage groups")
    public ResponseEntity<ResParseReadingBlockDTO> parseReadingBlock(
            @Valid @RequestBody ReqParseReadingBlockDTO request) throws IdInvalidException {
        return ResponseEntity.ok(aiReadingImportService.parseReadingBlock(request));
    }

    @PostMapping("/ai/reading-generate")
    @ApiMessage("Generate reading passages and sub-questions from prompt")
    public ResponseEntity<ResParseReadingBlockDTO> generateReadingSection(
            @Valid @RequestBody ReqGenerateReadingSectionDTO request) throws IdInvalidException {
        return ResponseEntity.ok(aiReadingImportService.generateReadingFromPrompt(request));
    }
}
