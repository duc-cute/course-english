package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqCreateVocabularyWordDTO;
import com.courseenglish.api.domain.request.ReqLookupVocabularyWordDTO;
import com.courseenglish.api.domain.request.ReqSearchVocabularyWordDTO;
import com.courseenglish.api.domain.request.ReqUpdateVocabularyWordDTO;
import com.courseenglish.api.domain.response.ResVocabularyWordDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.VocabularyWordService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vocabulary-words")
public class VocabularyWordController {

    private final VocabularyWordService vocabularyWordService;

    public VocabularyWordController(VocabularyWordService vocabularyWordService) {
        this.vocabularyWordService = vocabularyWordService;
    }

    @PostMapping("/search")
    @ApiMessage("Search vocabulary words")
    public ResponseEntity<ResultPaginationDTO> search(@RequestBody(required = false) ReqSearchVocabularyWordDTO req) {
        return ResponseEntity.ok(vocabularyWordService.search(req));
    }

    @GetMapping("/{id}")
    @ApiMessage("Get vocabulary word by id")
    public ResponseEntity<ResVocabularyWordDTO> getById(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(vocabularyWordService.getById(id));
    }

    @PostMapping("")
    @ApiMessage("Create vocabulary word with auto enrich")
    public ResponseEntity<ResVocabularyWordDTO> create(@Valid @RequestBody ReqCreateVocabularyWordDTO request)
            throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(vocabularyWordService.create(request));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update vocabulary word meaning")
    public ResponseEntity<ResVocabularyWordDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody ReqUpdateVocabularyWordDTO request) throws IdInvalidException {
        return ResponseEntity.ok(vocabularyWordService.update(id, request));
    }

    @PostMapping("/lookup")
    @ApiMessage("Preview dictionary enrichment without saving")
    public ResponseEntity<ResVocabularyWordDTO> lookup(@Valid @RequestBody ReqLookupVocabularyWordDTO request) {
        return vocabularyWordService.lookupPreview(request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/{id}/enrich")
    @ApiMessage("Enrich vocabulary word from dictionary API")
    public ResponseEntity<ResVocabularyWordDTO> enrich(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "false") boolean force) throws IdInvalidException {
        return ResponseEntity.ok(vocabularyWordService.enrich(id, force));
    }
}
