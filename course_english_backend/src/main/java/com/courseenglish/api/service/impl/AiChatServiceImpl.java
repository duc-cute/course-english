package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.AiConversation;
import com.courseenglish.api.domain.AiMessage;
import com.courseenglish.api.domain.request.ReqCreateAiConversationDTO;
import com.courseenglish.api.domain.request.ReqSendAiMessageDTO;
import com.courseenglish.api.domain.request.ReqUpdateAiConversationDTO;
import com.courseenglish.api.domain.response.ResAiConversationDTO;
import com.courseenglish.api.domain.response.ResAiConversationDTO;
import com.courseenglish.api.domain.response.ResAiMessageDTO;
import com.courseenglish.api.domain.response.ResAiMessagePageDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.AiConversationRepository;
import com.courseenglish.api.repository.AiMessageRepository;
import com.courseenglish.api.service.AiChatService;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.constant.AiMessageContentTypeEnum;
import com.courseenglish.api.util.constant.AiMessageRoleEnum;
import com.courseenglish.api.util.constant.AiMessageStatusEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executor;

@Service
public class AiChatServiceImpl implements AiChatService {

    private final AiConversationRepository aiConversationRepository;
    private final AiMessageRepository aiMessageRepository;
    private final OpenRouterClient openRouterClient;
    private final TransactionTemplate transactionTemplate;
    private final Executor aiStreamExecutor;

    @Value("${app.ai.enabled:true}")
    private boolean aiEnabled;

    @Value("${app.ai.default-chat-model:google/gemini-2.0-flash-001}")
    private String defaultChatModel;

    @Value("${app.ai.max-context-messages:20}")
    private int maxContextMessages;

    @Value("${app.ai.daily-request-limit:50}")
    private int dailyRequestLimit;

    @Value("${app.ai.request-timeout-sec:120}")
    private long requestTimeoutSec;

    @Value("${app.ai.system-prompt:}")
    private String configuredSystemPrompt;

    private static final String DEFAULT_SYSTEM_PROMPT =
            "You are LinguistAI, the English learning assistant for Course English. "
                    + "When replying in Vietnamese: always call yourself \"em\" and address the user as \"cô\" by default "
                    + "(the system has no gender field; never use \"cô/anh\" or \"anh\"). "
                    + "Answer clearly and practically. Do not fabricate lesson facts. "
                    + "Reply in the same language the user writes in.";

    public AiChatServiceImpl(
            AiConversationRepository aiConversationRepository,
            AiMessageRepository aiMessageRepository,
            OpenRouterClient openRouterClient,
            TransactionTemplate transactionTemplate,
            @Qualifier("aiStreamExecutor") Executor aiStreamExecutor) {
        this.aiConversationRepository = aiConversationRepository;
        this.aiMessageRepository = aiMessageRepository;
        this.openRouterClient = openRouterClient;
        this.transactionTemplate = transactionTemplate;
        this.aiStreamExecutor = aiStreamExecutor;
    }

    @Override
    public ResultPaginationDTO getMyConversations(Integer page, Integer size) throws IdInvalidException {
        UUID userId = currentUserId();
        int pageNo = page != null && page >= 0 ? page : 0;
        int pageSize = size != null && size > 0 ? Math.min(size, 50) : 10;
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        Page<AiConversation> result = aiConversationRepository
                .findByUserIdAndVoidedFalseOrderByLastMessageAtDescCreatedAtDesc(userId, pageable);

        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(result.getNumber() + 1);
        meta.setPageSize(result.getSize());
        meta.setPages(result.getTotalPages());
        meta.setTotal(result.getTotalElements());

        List<ResAiConversationDTO> rows = result.getContent().stream().map(this::toConversationDto).toList();

        ResultPaginationDTO dto = new ResultPaginationDTO();
        dto.setMeta(meta);
        dto.setResult(rows);
        return dto;
    }

    @Override
    @Transactional
    public UUID createConversation(ReqCreateAiConversationDTO request) throws IdInvalidException {
        UUID userId = currentUserId();
        AiConversation entity = new AiConversation();
        entity.setUserId(userId);
        entity.setTitle(trimToNull(request != null ? request.getTitle() : null));
        entity.setLastMessageAt(Instant.now());
        return aiConversationRepository.save(entity).getId();
    }

    @Override
    @Transactional
    public ResAiConversationDTO updateConversation(UUID conversationId, ReqUpdateAiConversationDTO request)
            throws IdInvalidException {
        UUID userId = currentUserId();
        AiConversation conversation = requireConversation(conversationId, userId);
        String title = request.getTitle().trim();
        if (title.isBlank()) {
            throw new IdInvalidException("Tiêu đề không được để trống");
        }
        if (title.length() > 255) {
            throw new IdInvalidException("Tiêu đề tối đa 255 ký tự");
        }
        conversation.setTitle(title);
        return toConversationDto(aiConversationRepository.save(conversation));
    }

    @Override
    @Transactional
    public void deleteConversation(UUID conversationId) throws IdInvalidException {
        UUID userId = currentUserId();
        AiConversation conversation = requireConversation(conversationId, userId);
        conversation.setVoided(true);
        aiConversationRepository.save(conversation);
    }

    @Override
    public ResAiMessagePageDTO getMessages(UUID conversationId, Integer limit, UUID before) throws IdInvalidException {
        UUID userId = currentUserId();
        AiConversation conversation = requireConversation(conversationId, userId);

        int pageSize = limit != null && limit > 0 ? Math.min(limit, 50) : 30;
        Pageable pageable = PageRequest.of(0, pageSize);
        List<AiMessage> descRows;
        if (before == null) {
            descRows = aiMessageRepository.findByConversation_IdAndVoidedFalseOrderByCreatedAtDesc(
                    conversation.getId(), pageable);
        } else {
            AiMessage beforeMsg = aiMessageRepository.findByIdAndConversation_IdAndVoidedFalse(before, conversation.getId())
                    .orElseThrow(() -> new IdInvalidException("before message không tồn tại"));
            descRows = aiMessageRepository.findBeforeCreatedAt(conversation.getId(), beforeMsg.getCreatedAt(), pageable);
        }

        List<AiMessage> ascRows = new ArrayList<>(descRows);
        Collections.reverse(ascRows);

        ResAiMessagePageDTO result = new ResAiMessagePageDTO();
        result.setItems(ascRows.stream().map(this::toMessageDto).toList());
        result.setHasMore(descRows.size() == pageSize);
        result.setNextBefore(descRows.isEmpty() ? null : descRows.get(descRows.size() - 1).getId());
        return result;
    }

    @Override
    @Transactional
    public ResAiMessageDTO sendMessage(UUID conversationId, ReqSendAiMessageDTO request) throws IdInvalidException {
        if (!aiEnabled) {
            throw new IdInvalidException("AI Assistant đang tắt");
        }

        UUID userId = currentUserId();
        AiConversation conversation = requireConversation(conversationId, userId);
        enforceDailyQuota(userId);

        String userContent = request.getContent().trim();
        if (userContent.length() > 8000) {
            throw new IdInvalidException("Nội dung quá dài (tối đa 8000 ký tự)");
        }

        // Gọi AI trước — chỉ lưu DB khi thành công để tránh tích lũy tin user orphan khi 429/timeout.
        List<Map<String, String>> contextMessages = buildContextForSend(conversation.getId(), userContent);
        OpenRouterClient.ChatResult aiReply = openRouterClient.chat(defaultChatModel, contextMessages);

        return persistTurnAfterAiSuccess(conversation.getId(), userContent, aiReply);
    }

    @Override
    public SseEmitter sendMessageStream(UUID conversationId, ReqSendAiMessageDTO request) throws IdInvalidException {
        if (!aiEnabled) {
            throw new IdInvalidException("AI Assistant đang tắt");
        }

        UUID userId = currentUserId();
        AiConversation conversation = requireConversation(conversationId, userId);
        enforceDailyQuota(userId);

        String userContent = request.getContent().trim();
        if (userContent.length() > 8000) {
            throw new IdInvalidException("Nội dung quá dài (tối đa 8000 ký tự)");
        }

        List<Map<String, String>> contextMessages = buildContextForSend(conversation.getId(), userContent);
        UUID convId = conversation.getId();

        long emitterTimeoutMs = (requestTimeoutSec + 30L) * 1000L;
        SseEmitter emitter = new SseEmitter(emitterTimeoutMs);
        emitter.onTimeout(emitter::complete);

        aiStreamExecutor.execute(() -> {
            try {
                openRouterClient.chatStream(defaultChatModel, contextMessages, new OpenRouterClient.StreamHandler() {
                    @Override
                    public void onChunk(String delta) throws IOException {
                        emitter.send(SseEmitter.event().name("chunk").data(Map.of("delta", delta)));
                    }

                    @Override
                    public void onComplete(OpenRouterClient.ChatResult result) throws IOException {
                        ResAiMessageDTO assistantDto = transactionTemplate.execute(status ->
                                persistTurnAfterAiSuccess(convId, userContent, result));
                        emitter.send(SseEmitter.event().name("done").data(assistantDto));
                        emitter.complete();
                    }
                });
            } catch (IdInvalidException ex) {
                sendStreamError(emitter, ex.getMessage());
            } catch (Exception ex) {
                sendStreamError(emitter, "Không gửi được tin nhắn AI");
            }
        });

        return emitter;
    }

    private ResAiMessageDTO persistTurnAfterAiSuccess(
            UUID conversationId,
            String userContent,
            OpenRouterClient.ChatResult aiReply) {
        AiConversation conversation = aiConversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalStateException("Conversation không tồn tại"));

        AiMessage userMessage = new AiMessage();
        userMessage.setConversation(conversation);
        userMessage.setRole(AiMessageRoleEnum.USER);
        userMessage.setContentType(AiMessageContentTypeEnum.TEXT);
        userMessage.setContent(userContent);
        userMessage.setStatus(AiMessageStatusEnum.COMPLETED);
        aiMessageRepository.save(userMessage);

        AiMessage assistantMessage = new AiMessage();
        assistantMessage.setConversation(conversation);
        assistantMessage.setRole(AiMessageRoleEnum.ASSISTANT);
        assistantMessage.setContentType(AiMessageContentTypeEnum.MARKDOWN);
        assistantMessage.setContent(aiReply.getContent());
        assistantMessage.setModel(defaultChatModel);
        assistantMessage.setPromptTokens(aiReply.getPromptTokens());
        assistantMessage.setCompletionTokens(aiReply.getCompletionTokens());
        assistantMessage.setStatus(AiMessageStatusEnum.COMPLETED);
        AiMessage savedAssistant = aiMessageRepository.save(assistantMessage);

        if (conversation.getTitle() == null || conversation.getTitle().isBlank()) {
            conversation.setTitle(makeTitle(userContent));
        }
        conversation.setLastMessageAt(Instant.now());
        aiConversationRepository.save(conversation);

        return toMessageDto(savedAssistant);
    }

    private void sendStreamError(SseEmitter emitter, String message) {
        try {
            emitter.send(SseEmitter.event().name("error").data(Map.of("message", message)));
            emitter.complete();
        } catch (IOException ignored) {
            emitter.completeWithError(new RuntimeException(message));
        }
    }

    /**
     * Lịch sử đã lưu trong DB + tin user hiện tại (chưa persist — chỉ gửi OpenRouter).
     */
    private List<Map<String, String>> buildContextForSend(UUID conversationId, String currentUserContent) {
        List<Map<String, String>> payload = buildHistoryPayload(conversationId);
        payload.add(Map.of("role", "user", "content", currentUserContent));
        return payload;
    }

    private List<Map<String, String>> buildHistoryPayload(UUID conversationId) {
        List<AiMessage> previousDesc = aiMessageRepository
                .findByConversation_IdAndVoidedFalseOrderByCreatedAtDesc(conversationId, PageRequest.of(0, maxContextMessages));
        List<AiMessage> previousAsc = new ArrayList<>(previousDesc);
        Collections.reverse(previousAsc);
        List<AiMessage> pairedOnly = keepCompletedTurnsOnly(previousAsc);

        List<Map<String, String>> payload = new ArrayList<>();
        payload.add(Map.of("role", "system", "content", resolveSystemPrompt()));
        for (AiMessage item : pairedOnly) {
            if (item.getRole() == AiMessageRoleEnum.SYSTEM) {
                continue;
            }
            payload.add(Map.of(
                    "role", item.getRole() == AiMessageRoleEnum.USER ? "user" : "assistant",
                    "content", item.getContent()
            ));
        }
        return payload;
    }

    private String resolveSystemPrompt() {
        if (configuredSystemPrompt == null || configuredSystemPrompt.isBlank()) {
            return DEFAULT_SYSTEM_PROMPT;
        }
        return configuredSystemPrompt.trim().replace("\\n", "\n");
    }

    /** Bỏ tin user lẻ (AI fail 429) — chỉ giữ cặp user + assistant đã hoàn thành. */
    private List<AiMessage> keepCompletedTurnsOnly(List<AiMessage> chronological) {
        List<AiMessage> result = new ArrayList<>();
        int i = 0;
        while (i < chronological.size()) {
            AiMessage current = chronological.get(i);
            if (i + 1 < chronological.size()) {
                AiMessage next = chronological.get(i + 1);
                if (current.getRole() == AiMessageRoleEnum.USER
                        && next.getRole() == AiMessageRoleEnum.ASSISTANT) {
                    result.add(current);
                    result.add(next);
                    i += 2;
                    continue;
                }
            }
            i++;
        }
        return result;
    }

    private void enforceDailyQuota(UUID userId) throws IdInvalidException {
        Instant start = LocalDate.now(ZoneId.systemDefault()).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = start.plusSeconds(24 * 60 * 60);
        long used = aiMessageRepository.countByUserRoleInRange(userId, AiMessageRoleEnum.USER, start, end);
        if (used >= dailyRequestLimit) {
            throw new IdInvalidException("Đã hết lượt AI hôm nay");
        }
    }

    private AiConversation requireConversation(UUID conversationId, UUID userId) throws IdInvalidException {
        return aiConversationRepository.findByIdAndUserIdAndVoidedFalse(conversationId, userId)
                .orElseThrow(() -> new IdInvalidException("Conversation không tồn tại"));
    }

    private UUID currentUserId() throws IdInvalidException {
        return SercurityUtil.getCurrentUserId()
                .orElseThrow(() -> new IdInvalidException("Không xác định được người dùng hiện tại"));
    }

    private ResAiConversationDTO toConversationDto(AiConversation entity) {
        ResAiConversationDTO dto = new ResAiConversationDTO();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setLastMessageAt(entity.getLastMessageAt());
        return dto;
    }

    private ResAiMessageDTO toMessageDto(AiMessage entity) {
        ResAiMessageDTO dto = new ResAiMessageDTO();
        dto.setId(entity.getId());
        dto.setConversationId(entity.getConversation().getId());
        dto.setRole(entity.getRole());
        dto.setContentType(entity.getContentType());
        dto.setContent(entity.getContent());
        dto.setModel(entity.getModel());
        dto.setPromptTokens(entity.getPromptTokens());
        dto.setCompletionTokens(entity.getCompletionTokens());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String makeTitle(String firstMessage) {
        String normalized = firstMessage.trim().replaceAll("\\s+", " ");
        int max = 60;
        if (normalized.length() <= max) {
            return normalized;
        }
        return normalized.substring(0, max) + "...";
    }
}
