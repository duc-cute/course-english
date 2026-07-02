package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqSearchStoryDTO;
import com.courseenglish.api.domain.request.ReqStoryAiPreviewDTO;
import com.courseenglish.api.domain.request.ReqStoryCoverPreviewDTO;
import com.courseenglish.api.domain.request.ReqStoryDTO;
import com.courseenglish.api.domain.request.ReqStoryWordEnrichDTO;
import com.courseenglish.api.domain.response.ResStoryAiPreviewDTO;
import com.courseenglish.api.domain.response.ResStoryAudioDTO;
import com.courseenglish.api.domain.response.ResStoryCoverPreviewDTO;
import com.courseenglish.api.domain.response.ResStoryDTO;
import com.courseenglish.api.domain.response.ResStoryReaderPayloadDTO;
import com.courseenglish.api.domain.response.ResTtsVoiceCatalogDTO;
import com.courseenglish.api.domain.response.ResStoryWordEnrichDTO;
import com.courseenglish.api.domain.response.ResStoryWordLookupDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.story.AiStoryPreviewService;
import com.courseenglish.api.service.story.StoryCoverImageService;
import com.courseenglish.api.service.story.StoryAudioService;
import com.courseenglish.api.service.story.StoryWordAiEnrichService;
import com.courseenglish.api.service.story.StoryVoiceCatalogService;
import com.courseenglish.api.service.StoryService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/v1/stories")
public class StoryController {

    private final StoryService storyService;
    private final AiStoryPreviewService aiStoryPreviewService;
    private final StoryAudioService storyAudioService;
    private final StoryCoverImageService storyCoverImageService;
    private final StoryWordAiEnrichService storyWordAiEnrichService;
    private final StoryVoiceCatalogService storyVoiceCatalogService;

    public StoryController(
            StoryService storyService,
            AiStoryPreviewService aiStoryPreviewService,
            StoryAudioService storyAudioService,
            StoryCoverImageService storyCoverImageService,
            StoryWordAiEnrichService storyWordAiEnrichService,
            StoryVoiceCatalogService storyVoiceCatalogService) {
        this.storyService = storyService;
        this.aiStoryPreviewService = aiStoryPreviewService;
        this.storyAudioService = storyAudioService;
        this.storyCoverImageService = storyCoverImageService;
        this.storyWordAiEnrichService = storyWordAiEnrichService;
        this.storyVoiceCatalogService = storyVoiceCatalogService;
    }

    @PostMapping("/search")
    @ApiMessage("Search stories")
    public ResponseEntity<ResultPaginationDTO> search(@RequestBody(required = false) ReqSearchStoryDTO req) {
        return ResponseEntity.ok(storyService.search(req));
    }

    @GetMapping("/{id}")
    @ApiMessage("Get story by id")
    public ResponseEntity<ResStoryDTO> getById(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(storyService.getById(id));
    }

    @GetMapping("/{id}/reader-payload")
    @ApiMessage("Get story reader payload")
    public ResponseEntity<ResStoryReaderPayloadDTO> getReaderPayload(@PathVariable UUID id)
            throws IdInvalidException {
        return ResponseEntity.ok(storyService.getReaderPayloadById(id));
    }

    @GetMapping("/slug/{slug}/reader-payload")
    @ApiMessage("Get story reader payload by slug")
    public ResponseEntity<ResStoryReaderPayloadDTO> getReaderPayloadBySlug(@PathVariable String slug)
            throws IdInvalidException {
        return ResponseEntity.ok(storyService.getReaderPayloadBySlug(slug));
    }

    @GetMapping("/lookup-word")
    @ApiMessage("Lookup word for story reader popup")
    public ResponseEntity<ResStoryWordLookupDTO> lookupWord(@RequestParam String word) throws IdInvalidException {
        return ResponseEntity.ok(storyService.lookupWord(word));
    }

    @GetMapping("/voice-catalog")
    @ApiMessage("List active TTS voices for story casting")
    public ResponseEntity<List<ResTtsVoiceCatalogDTO>> listVoiceCatalog(
            @RequestParam(required = false) String profileKey) {
        return ResponseEntity.ok(storyVoiceCatalogService.listActiveVoices(profileKey));
    }

    @PostMapping("/lookup-word/enrich")
    @ApiMessage("AI enrich Vietnamese meaning for story word popup")
    public ResponseEntity<ResStoryWordEnrichDTO> enrichWord(@Valid @RequestBody ReqStoryWordEnrichDTO request)
            throws IdInvalidException {
        return ResponseEntity.ok(storyWordAiEnrichService.enrich(request));
    }

    @PostMapping("")
    @ApiMessage("Create story")
    public ResponseEntity<ResStoryDTO> create(@Valid @RequestBody ReqStoryDTO request) throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(storyService.create(request));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update story")
    public ResponseEntity<ResStoryDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody ReqStoryDTO request) throws IdInvalidException {
        return ResponseEntity.ok(storyService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete story")
    public ResponseEntity<Void> delete(@PathVariable UUID id) throws IdInvalidException {
        storyService.delete(id);
        return ResponseEntity.ok(null);
    }

    @PostMapping("/ai-preview")
    @ApiMessage("AI preview story plain text")
    public ResponseEntity<ResStoryAiPreviewDTO> aiPreview(@Valid @RequestBody ReqStoryAiPreviewDTO request)
            throws IdInvalidException {
        return ResponseEntity.ok(aiStoryPreviewService.preview(request));
    }

    @PostMapping("/ai-cover-preview")
    @ApiMessage("AI preview story cover image")
    public ResponseEntity<ResStoryCoverPreviewDTO> aiCoverPreview(
            @Valid @RequestBody ReqStoryCoverPreviewDTO request) throws IdInvalidException {
        return ResponseEntity.ok(storyCoverImageService.preview(request));
    }

    @PostMapping("/{id}/generate-audio")
    @ApiMessage("Queue story audio generation via speech platform")
    public ResponseEntity<ResStoryAudioDTO> generateAudio(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.accepted().body(storyAudioService.queueGeneration(id));
    }

    @GetMapping("/{id}/audio")
    @ApiMessage("Get story audio generation status")
    public ResponseEntity<ResStoryAudioDTO> getAudioStatus(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(storyAudioService.getAudioStatus(id));
    }
}
