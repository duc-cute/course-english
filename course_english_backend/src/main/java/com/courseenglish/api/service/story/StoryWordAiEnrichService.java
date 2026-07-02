package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.request.ReqStoryWordEnrichDTO;
import com.courseenglish.api.domain.response.ResStoryWordEnrichDTO;
import com.courseenglish.api.repository.VocabularyWordRepository;
import com.courseenglish.api.service.impl.OpenRouterClient;
import com.courseenglish.api.util.StoryWordKeyUtil;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class StoryWordAiEnrichService {

    private static final Logger log = LoggerFactory.getLogger(StoryWordAiEnrichService.class);
    private static final int MAX_CONTEXT_CHARS = 400;

    private static final String SYSTEM_PROMPT =
            """
            You are an English-to-Vietnamese dictionary assistant for Vietnamese learners reading stories.
            Return ONLY one JSON object (no markdown):
            {
              "meaningVi": "string — primary Vietnamese meaning, short and learner-friendly",
              "confidence": 0.0
            }
            Rules:
            - Choose the meaning that best fits the sentence context.
            - meaningVi should be concise (usually 1-8 words), natural Vietnamese.
            - confidence is between 0 and 1.
            - If the word is unclear, still give your best guess with lower confidence.
            """;

    private final OpenRouterClient openRouterClient;
    private final ObjectMapper objectMapper;
    private final VocabularyWordRepository vocabularyWordRepository;
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    @Value("${app.ai.enabled:true}")
    private boolean aiEnabled;

    @Value("${app.ai.story-word-enrich.enabled:true}")
    private boolean enrichEnabled;

    @Value("${app.ai.story-word-enrich.model:openrouter/owl-alpha}")
    private String enrichModel;

    @Value("${app.ai.story-word-enrich.timeout-sec:20}")
    private long enrichTimeoutSec;

    @Value("${app.ai.story-word-enrich.cache-ttl-sec:86400}")
    private long cacheTtlSec;

    public StoryWordAiEnrichService(
            OpenRouterClient openRouterClient,
            ObjectMapper objectMapper,
            VocabularyWordRepository vocabularyWordRepository) {
        this.openRouterClient = openRouterClient;
        this.objectMapper = objectMapper;
        this.vocabularyWordRepository = vocabularyWordRepository;
    }

    public ResStoryWordEnrichDTO enrich(ReqStoryWordEnrichDTO request) throws IdInvalidException {
        if (!aiEnabled || !enrichEnabled) {
            throw new IdInvalidException("AI enrich nghĩa từ đang tắt");
        }
        if (request.getWord() == null || request.getWord().isBlank()) {
            throw new IdInvalidException("Từ không hợp lệ");
        }

        String wordEn = request.getWord().trim();
        String wordKey = StoryWordKeyUtil.toWordKey(wordEn);
        if (wordKey.isBlank()) {
            throw new IdInvalidException("Từ không hợp lệ");
        }

        var existing = vocabularyWordRepository.findByWordKeyAndVoidedFalse(wordKey);
        if (existing.isPresent() && existing.get().getMeaningVi() != null && !existing.get().getMeaningVi().isBlank()) {
            ResStoryWordEnrichDTO dto = new ResStoryWordEnrichDTO();
            dto.setWordEn(wordEn);
            dto.setWordKey(wordKey);
            dto.setMeaningVi(existing.get().getMeaningVi().trim());
            dto.setMeaningSource("db");
            dto.setConfidence(1.0);
            dto.setCached(true);
            return dto;
        }

        String context = normalizeContext(request.getContextSentence());
        String cacheKey = buildCacheKey(wordKey, context);
        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && !cached.isExpired(cacheTtlSec)) {
            log.debug("[StoryWordEnrich] cache hit wordKey={}", wordKey);
            ResStoryWordEnrichDTO dto = cached.dto();
            dto.setCached(true);
            return dto;
        }

        String userPrompt = buildUserPrompt(wordEn, wordKey, context, request.getLevel(), request.getPartOfSpeech());
        log.info(
                "[StoryWordEnrich] start model={} wordKey={} contextLength={}",
                enrichModel,
                wordKey,
                context.length());

        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", SYSTEM_PROMPT),
                Map.of("role", "user", "content", userPrompt));

        OpenRouterClient.ChatResult chat = openRouterClient.chatJson(enrichModel, messages, enrichTimeoutSec);

        try {
            JsonNode root = objectMapper.readTree(chat.getContent());
            String meaningVi = textOrBlank(root, "meaningVi");
            if (meaningVi.isBlank()) {
                throw new IdInvalidException("AI không trả nghĩa tiếng Việt hợp lệ");
            }

            double confidence = root.path("confidence").asDouble(0.75);
            if (confidence < 0) {
                confidence = 0;
            } else if (confidence > 1) {
                confidence = 1;
            }

            ResStoryWordEnrichDTO dto = new ResStoryWordEnrichDTO();
            dto.setWordEn(wordEn);
            dto.setWordKey(wordKey);
            dto.setMeaningVi(meaningVi.trim());
            dto.setMeaningSource("ai");
            dto.setConfidence(confidence);
            dto.setEnrichModel(enrichModel);
            dto.setCached(false);

            cache.put(cacheKey, new CacheEntry(dto, Instant.now()));
            log.info("[StoryWordEnrich] success wordKey={} confidence={}", wordKey, confidence);
            return dto;
        } catch (IdInvalidException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("[StoryWordEnrich] parse failed wordKey={} error={}", wordKey, ex.getMessage());
            throw new IdInvalidException("Không phân tích được phản hồi AI enrich: " + ex.getMessage());
        }
    }

    private static String buildUserPrompt(
            String wordEn, String wordKey, String context, String level, String partOfSpeech) {
        StringBuilder sb = new StringBuilder();
        sb.append("Translate the English word to Vietnamese for a story reader popup.\n\n");
        sb.append("Word: ").append(wordEn).append("\n");
        sb.append("Normalized key: ").append(wordKey).append("\n");
        if (level != null && !level.isBlank()) {
            sb.append("Learner level: ").append(level.trim()).append("\n");
        }
        if (partOfSpeech != null && !partOfSpeech.isBlank()) {
            sb.append("Part of speech hint: ").append(partOfSpeech.trim()).append("\n");
        }
        if (!context.isBlank()) {
            sb.append("Sentence context:\n").append(context).append("\n");
        } else {
            sb.append("Sentence context: (not provided — use the most common learner-friendly meaning)\n");
        }
        sb.append("\nReturn JSON only.");
        return sb.toString();
    }

    private static String normalizeContext(String contextSentence) {
        if (contextSentence == null) {
            return "";
        }
        String trimmed = contextSentence.trim().replaceAll("\\s+", " ");
        if (trimmed.length() <= MAX_CONTEXT_CHARS) {
            return trimmed;
        }
        return trimmed.substring(0, MAX_CONTEXT_CHARS);
    }

    private static String buildCacheKey(String wordKey, String context) {
        String ctx = context.isBlank() ? "" : context.toLowerCase();
        return wordKey + "|" + Integer.toHexString(ctx.hashCode());
    }

    private static String textOrBlank(JsonNode root, String field) {
        if (root == null || !root.has(field) || root.get(field).isNull()) {
            return "";
        }
        return root.get(field).asText("").trim();
    }

    private record CacheEntry(ResStoryWordEnrichDTO dto, Instant createdAt) {
        boolean isExpired(long ttlSec) {
            return Instant.now().isAfter(createdAt.plusSeconds(ttlSec));
        }
    }
}
