package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqCreateAiConversationDTO;
import com.courseenglish.api.domain.request.ReqSendAiMessageDTO;
import com.courseenglish.api.domain.request.ReqUpdateAiConversationDTO;
import com.courseenglish.api.domain.response.ResAiConversationDTO;
import com.courseenglish.api.domain.response.ResAiMessageDTO;
import com.courseenglish.api.domain.response.ResAiMessagePageDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.AiChatService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/conversations")
public class AiConversationController {

    private final AiChatService aiChatService;

    public AiConversationController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    @GetMapping("")
    @ApiMessage("List my AI conversations")
    public ResponseEntity<ResultPaginationDTO> list(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) throws IdInvalidException {
        return ResponseEntity.ok(aiChatService.getMyConversations(page, size));
    }

    @PostMapping("")
    @ApiMessage("Create AI conversation")
    public ResponseEntity<Map<String, UUID>> create(@RequestBody(required = false) ReqCreateAiConversationDTO request)
            throws IdInvalidException {
        UUID id = aiChatService.createConversation(request == null ? new ReqCreateAiConversationDTO() : request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id));
    }

    @PatchMapping("/{id}")
    @ApiMessage("Update AI conversation title")
    public ResponseEntity<ResAiConversationDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody ReqUpdateAiConversationDTO request) throws IdInvalidException {
        return ResponseEntity.ok(aiChatService.updateConversation(id, request));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete AI conversation")
    public ResponseEntity<Void> delete(@PathVariable UUID id) throws IdInvalidException {
        aiChatService.deleteConversation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/messages")
    @ApiMessage("Get AI messages by conversation")
    public ResponseEntity<ResAiMessagePageDTO> messages(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "30") Integer limit,
            @RequestParam(required = false) UUID before) throws IdInvalidException {
        return ResponseEntity.ok(aiChatService.getMessages(id, limit, before));
    }

    @PostMapping("/{id}/messages")
    @ApiMessage("Send message to AI conversation")
    public ResponseEntity<ResAiMessageDTO> send(
            @PathVariable UUID id,
            @Valid @RequestBody ReqSendAiMessageDTO request) throws IdInvalidException {
        return ResponseEntity.ok(aiChatService.sendMessage(id, request));
    }

    @PostMapping(value = "/{id}/messages/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @ApiMessage("Stream message to AI conversation")
    public SseEmitter sendStream(
            @PathVariable UUID id,
            @Valid @RequestBody ReqSendAiMessageDTO request) throws IdInvalidException {
        return aiChatService.sendMessageStream(id, request);
    }
}
