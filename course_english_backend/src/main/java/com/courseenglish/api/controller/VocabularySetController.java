package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqSearchVocabularySetDTO;
import com.courseenglish.api.domain.request.ReqVocabularySetDTO;
import com.courseenglish.api.domain.response.ResVocabularySetDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.VocabularySetService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vocabulary-sets")
public class VocabularySetController {

    private final VocabularySetService vocabularySetService;

    public VocabularySetController(VocabularySetService vocabularySetService) {
        this.vocabularySetService = vocabularySetService;
    }

    @PostMapping("/search")
    @ApiMessage("Search vocabulary sets")
    public ResponseEntity<ResultPaginationDTO> search(@RequestBody(required = false) ReqSearchVocabularySetDTO req) {
        return ResponseEntity.ok(vocabularySetService.search(req));
    }

    @GetMapping("/{id}")
    @ApiMessage("Get vocabulary set by id")
    public ResponseEntity<ResVocabularySetDTO> getById(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(vocabularySetService.getById(id));
    }

    @PostMapping("")
    @ApiMessage("Create vocabulary set")
    public ResponseEntity<ResVocabularySetDTO> create(@Valid @RequestBody ReqVocabularySetDTO request)
            throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(vocabularySetService.create(request));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update vocabulary set")
    public ResponseEntity<ResVocabularySetDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody ReqVocabularySetDTO request) throws IdInvalidException {
        return ResponseEntity.ok(vocabularySetService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete vocabulary set")
    public ResponseEntity<Void> delete(@PathVariable UUID id) throws IdInvalidException {
        vocabularySetService.delete(id);
        return ResponseEntity.ok(null);
    }
}
