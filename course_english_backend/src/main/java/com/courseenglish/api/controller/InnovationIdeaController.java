package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqCreateInnovationCommentDTO;
import com.courseenglish.api.domain.request.ReqCreateInnovationIdeaDTO;
import com.courseenglish.api.domain.request.ReqSearchInnovationIdeaDTO;
import com.courseenglish.api.domain.request.ReqUpdateInnovationIdeaStatusDTO;
import com.courseenglish.api.domain.response.ResInnovationCommentDTO;
import com.courseenglish.api.domain.response.ResInnovationHubStatsDTO;
import com.courseenglish.api.domain.response.ResInnovationIdeaDTO;
import com.courseenglish.api.domain.response.ResInnovationVoteToggleDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.InnovationIdeaService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/innovation-ideas")
public class InnovationIdeaController {

    private final InnovationIdeaService innovationIdeaService;

    public InnovationIdeaController(InnovationIdeaService innovationIdeaService) {
        this.innovationIdeaService = innovationIdeaService;
    }

    @PostMapping("/search")
    @ApiMessage("Fetch innovation ideas")
    public ResponseEntity<ResultPaginationDTO> search(@RequestBody(required = false) ReqSearchInnovationIdeaDTO req)
            throws IdInvalidException {
        return ResponseEntity.ok(innovationIdeaService.search(req));
    }

    @GetMapping("/stats/summary")
    @ApiMessage("Fetch innovation hub stats")
    public ResponseEntity<ResInnovationHubStatsDTO> statsSummary() throws IdInvalidException {
        return ResponseEntity.ok(innovationIdeaService.getStatsSummary());
    }

    @GetMapping("/{id}")
    @ApiMessage("Fetch innovation idea by id")
    public ResponseEntity<ResInnovationIdeaDTO> getById(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(innovationIdeaService.getById(id));
    }

    @PostMapping("")
    @ApiMessage("Create innovation idea")
    public ResponseEntity<ResInnovationIdeaDTO> create(@Valid @RequestBody ReqCreateInnovationIdeaDTO req)
            throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(innovationIdeaService.create(req));
    }

    @PutMapping("/{id}/status")
    @ApiMessage("Update innovation idea status")
    public ResponseEntity<ResInnovationIdeaDTO> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ReqUpdateInnovationIdeaStatusDTO req
    ) throws IdInvalidException {
        return ResponseEntity.ok(innovationIdeaService.updateStatus(id, req));
    }

    @PostMapping("/{id}/votes")
    @ApiMessage("Toggle innovation idea vote")
    public ResponseEntity<ResInnovationVoteToggleDTO> toggleVote(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(innovationIdeaService.toggleVote(id));
    }

    @GetMapping("/{id}/comments")
    @ApiMessage("List innovation idea comments")
    public ResponseEntity<List<ResInnovationCommentDTO>> listComments(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(innovationIdeaService.listComments(id));
    }

    @PostMapping("/{id}/comments")
    @ApiMessage("Create innovation idea comment")
    public ResponseEntity<ResInnovationCommentDTO> createComment(
            @PathVariable UUID id,
            @Valid @RequestBody ReqCreateInnovationCommentDTO req
    ) throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(innovationIdeaService.createComment(id, req));
    }
}
