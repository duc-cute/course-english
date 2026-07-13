package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqSearchVocabularyJourneyDTO;
import com.courseenglish.api.domain.request.ReqVocabularyJourneyClassroomsDTO;
import com.courseenglish.api.domain.request.ReqVocabularyJourneyDTO;
import com.courseenglish.api.domain.request.ReqVocabularyTopicDTO;
import com.courseenglish.api.domain.request.ReqVocabularyTopicMembersDTO;
import com.courseenglish.api.domain.response.ResVocabularyJourneyDTO;
import com.courseenglish.api.domain.response.ResVocabularyTopicDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.VocabularyJourneyService;
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
public class VocabularyJourneyController {

    private final VocabularyJourneyService journeyService;

    public VocabularyJourneyController(VocabularyJourneyService journeyService) {
        this.journeyService = journeyService;
    }

    @PostMapping("/vocabulary-journeys/search")
    @ApiMessage("Search vocabulary journeys")
    public ResponseEntity<ResultPaginationDTO> search(
            @RequestBody(required = false) ReqSearchVocabularyJourneyDTO request) throws IdInvalidException {
        return ResponseEntity.ok(journeyService.search(request));
    }

    @GetMapping("/vocabulary-journeys/{id}")
    @ApiMessage("Get vocabulary journey")
    public ResponseEntity<ResVocabularyJourneyDTO> getById(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(journeyService.getById(id));
    }

    @PostMapping("/vocabulary-journeys")
    @ApiMessage("Create vocabulary journey")
    public ResponseEntity<ResVocabularyJourneyDTO> create(@Valid @RequestBody ReqVocabularyJourneyDTO request)
            throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(journeyService.create(request));
    }

    @PutMapping("/vocabulary-journeys/{id}")
    @ApiMessage("Update vocabulary journey")
    public ResponseEntity<ResVocabularyJourneyDTO> update(
            @PathVariable UUID id, @Valid @RequestBody ReqVocabularyJourneyDTO request)
            throws IdInvalidException {
        return ResponseEntity.ok(journeyService.update(id, request));
    }

    @DeleteMapping("/vocabulary-journeys/{id}")
    @ApiMessage("Delete vocabulary journey")
    public ResponseEntity<Void> delete(@PathVariable UUID id) throws IdInvalidException {
        journeyService.delete(id);
        return ResponseEntity.ok(null);
    }

    @PutMapping("/vocabulary-journeys/{id}/classrooms")
    @ApiMessage("Replace journey classroom assignments")
    public ResponseEntity<ResVocabularyJourneyDTO> replaceClassrooms(
            @PathVariable UUID id, @Valid @RequestBody ReqVocabularyJourneyClassroomsDTO request)
            throws IdInvalidException {
        return ResponseEntity.ok(journeyService.replaceClassrooms(id, request));
    }

    @GetMapping("/vocabulary-journeys/{id}/topics")
    @ApiMessage("List topics in journey")
    public ResponseEntity<List<ResVocabularyTopicDTO>> listTopics(@PathVariable UUID id)
            throws IdInvalidException {
        return ResponseEntity.ok(journeyService.listTopics(id));
    }

    @PostMapping("/vocabulary-topics")
    @ApiMessage("Create vocabulary topic")
    public ResponseEntity<ResVocabularyTopicDTO> createTopic(@Valid @RequestBody ReqVocabularyTopicDTO request)
            throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(journeyService.createTopic(request));
    }

    @GetMapping("/vocabulary-topics/{id}")
    @ApiMessage("Get vocabulary topic")
    public ResponseEntity<ResVocabularyTopicDTO> getTopic(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(journeyService.getTopic(id));
    }

    @PutMapping("/vocabulary-topics/{id}")
    @ApiMessage("Update vocabulary topic")
    public ResponseEntity<ResVocabularyTopicDTO> updateTopic(
            @PathVariable UUID id, @Valid @RequestBody ReqVocabularyTopicDTO request)
            throws IdInvalidException {
        return ResponseEntity.ok(journeyService.updateTopic(id, request));
    }

    @DeleteMapping("/vocabulary-topics/{id}")
    @ApiMessage("Delete vocabulary topic")
    public ResponseEntity<Void> deleteTopic(@PathVariable UUID id) throws IdInvalidException {
        journeyService.deleteTopic(id);
        return ResponseEntity.ok(null);
    }

    @PutMapping("/vocabulary-topics/{id}/members")
    @ApiMessage("Replace topic vocabulary sets")
    public ResponseEntity<ResVocabularyTopicDTO> replaceMembers(
            @PathVariable UUID id, @Valid @RequestBody ReqVocabularyTopicMembersDTO request)
            throws IdInvalidException {
        return ResponseEntity.ok(journeyService.replaceTopicMembers(id, request));
    }

    @GetMapping("/student/vocab/journeys")
    @ApiMessage("List published journeys for current student")
    public ResponseEntity<List<ResVocabularyJourneyDTO>> listStudentJourneys() throws IdInvalidException {
        return ResponseEntity.ok(journeyService.listForCurrentStudent());
    }

    @GetMapping("/student/vocab/journeys/{id}")
    @ApiMessage("Get published journey detail for current student")
    public ResponseEntity<ResVocabularyJourneyDTO> getStudentJourney(@PathVariable UUID id)
            throws IdInvalidException {
        return ResponseEntity.ok(journeyService.getForCurrentStudent(id));
    }

    @GetMapping("/student/vocab/topics/{id}/sets")
    @ApiMessage("List published sets in topic for current student")
    public ResponseEntity<ResVocabularyTopicDTO> getStudentTopicSets(@PathVariable UUID id)
            throws IdInvalidException {
        return ResponseEntity.ok(journeyService.getTopicSetsForCurrentStudent(id));
    }
}
