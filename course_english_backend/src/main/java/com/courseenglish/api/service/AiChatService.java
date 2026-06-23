package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqCreateAiConversationDTO;
import com.courseenglish.api.domain.request.ReqSendAiMessageDTO;
import com.courseenglish.api.domain.request.ReqUpdateAiConversationDTO;
import com.courseenglish.api.domain.response.ResAiConversationDTO;
import com.courseenglish.api.domain.response.ResAiMessageDTO;
import com.courseenglish.api.domain.response.ResAiMessagePageDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

public interface AiChatService {
    ResultPaginationDTO getMyConversations(Integer page, Integer size) throws IdInvalidException;

    UUID createConversation(ReqCreateAiConversationDTO request) throws IdInvalidException;

    ResAiConversationDTO updateConversation(UUID conversationId, ReqUpdateAiConversationDTO request)
            throws IdInvalidException;

    void deleteConversation(UUID conversationId) throws IdInvalidException;

    ResAiMessagePageDTO getMessages(UUID conversationId, Integer limit, UUID before) throws IdInvalidException;

    ResAiMessageDTO sendMessage(UUID conversationId, ReqSendAiMessageDTO request) throws IdInvalidException;

    SseEmitter sendMessageStream(UUID conversationId, ReqSendAiMessageDTO request) throws IdInvalidException;
}
