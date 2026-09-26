package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.Story;
import com.courseenglish.api.domain.dto.story.StorySentenceDTO;
import com.courseenglish.api.domain.dto.story.StoryTokensPayloadDTO;
import com.courseenglish.api.domain.dto.story.StoryTranslationsPayloadDTO;
import com.courseenglish.api.repository.StoryRepository;
import com.courseenglish.api.service.impl.OpenRouterClient;
import com.courseenglish.api.util.AppConstants;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Dịch lại toàn bộ câu + tựa của một story đã lưu — giữ nguyên tiếng Anh, tokens, scenes, ảnh, audio.
 * Chỉ ghi đè sentenceTranslations / titleVi trong translations_json (glossary giữ nguyên).
 */
@Service
public class StoryRetranslateService {

    private static final Logger log = LoggerFactory.getLogger(StoryRetranslateService.class);

    private static final String SYSTEM_PROMPT =
            """
            You are a Vietnamese literary translator working on an English learning story.
            Return ONLY one JSON object (no markdown):
            { "titleVi": "string", "sentenceTranslations": ["string", "..."] }

            Rules:
            - sentenceTranslations MUST have exactly one item per numbered English sentence, same order,
              same count. This is a hard constraint (used for karaoke alignment).
            - Translate as a Vietnamese author would write this story for Vietnamese readers: warm,
              natural, idiomatic, consistent tone across the whole story. Read everything first.
            - Within one sentence you may reorder clauses, change punctuation, drop pronouns
              ("you", "it", "we") where Vietnamese omits them, and use Vietnamese idioms.
              Never translate word by word.
            - Address the reader as "bạn"; short, spoken sentences, like a friend talking.
            - Example: "You write it down, say it aloud, and still it slips away."
              BAD: "Bạn viết nó ra, nói to lên, và nó vẫn trôi đi mất."
              GOOD: "Chép ra, đọc to lên, rồi nó vẫn cứ tuột khỏi đầu."
            - titleVi: like a real Vietnamese book title, not literal.
            """;

    private final StoryRepository storyRepository;
    private final OpenRouterClient openRouterClient;
    private final ObjectMapper objectMapper;
    private final StoryTranslationMergeService mergeService;

    public StoryRetranslateService(
            StoryRepository storyRepository,
            OpenRouterClient openRouterClient,
            ObjectMapper objectMapper,
            StoryTranslationMergeService mergeService) {
        this.storyRepository = storyRepository;
        this.openRouterClient = openRouterClient;
        this.objectMapper = objectMapper;
        this.mergeService = mergeService;
    }

    @Transactional(rollbackFor = Exception.class)
    public void retranslate(UUID storyId) throws IdInvalidException {
        Story story = storyRepository.findByIdAndVoidedFalse(storyId)
                .orElseThrow(() -> new IdInvalidException("Story không tồn tại"));
        if (story.getTokensJson() == null || story.getTokensJson().isBlank()) {
            throw new IdInvalidException("Story chưa tokenize — lưu story trước");
        }

        StoryTokensPayloadDTO tokens;
        StoryTranslationsPayloadDTO translations;
        try {
            tokens = objectMapper.readValue(story.getTokensJson(), StoryTokensPayloadDTO.class);
            translations = story.getTranslationsJson() == null || story.getTranslationsJson().isBlank()
                    ? new StoryTranslationsPayloadDTO()
                    : objectMapper.readValue(story.getTranslationsJson(), StoryTranslationsPayloadDTO.class);
        } catch (JsonProcessingException e) {
            throw new IdInvalidException("Không đọc được tokens/translations của story");
        }
        List<StorySentenceDTO> sentences = tokens.getSentences();
        if (sentences == null || sentences.isEmpty()) {
            throw new IdInvalidException("Story không có câu để dịch");
        }

        StringBuilder user = new StringBuilder();
        user.append("Title: ").append(story.getTitle()).append("\n");
        user.append("Level: ").append(story.getLevel() == null ? "A2" : story.getLevel()).append("\n\n");
        user.append("Full story:\n").append(story.getContent().trim()).append("\n\n");
        user.append("Numbered sentences (translate each, keep order and count = ")
                .append(sentences.size()).append("):\n");
        for (StorySentenceDTO s : sentences) {
            user.append(s.getSentenceIndex() + 1).append(". ").append(s.getText()).append("\n");
        }

        String model = AppConstants.aiVocabSetGenModel;
        log.info("[StoryRetranslate] Start storyId={} sentences={} model={}", storyId, sentences.size(), model);
        OpenRouterClient.ChatResult chat = openRouterClient.chatJson(
                model,
                List.of(
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user", "content", user.toString())),
                AppConstants.aiVocabSetGenTimeoutSec);

        List<String> vi = new ArrayList<>();
        String titleVi;
        try {
            JsonNode root = objectMapper.readTree(chat.getContent());
            for (JsonNode n : root.path("sentenceTranslations")) {
                vi.add(n.asText("").trim());
            }
            titleVi = root.path("titleVi").asText("").trim();
        } catch (Exception e) {
            throw new IdInvalidException("Không phân tích được kết quả AI: " + e.getMessage());
        }
        if (vi.size() != sentences.size()) {
            throw new IdInvalidException(
                    "AI trả " + vi.size() + " câu dịch, cần đúng " + sentences.size() + " — thử lại");
        }

        translations.setSentenceTranslations(vi);
        if (!titleVi.isBlank()) {
            translations.setTitleVi(titleVi);
        }
        mergeService.applySentenceTranslations(sentences, vi);
        try {
            story.setTranslationsJson(objectMapper.writeValueAsString(translations));
            story.setTokensJson(objectMapper.writeValueAsString(tokens));
        } catch (JsonProcessingException e) {
            throw new IdInvalidException("Không lưu được bản dịch");
        }
        storyRepository.save(story);
        log.info(
                "[StoryRetranslate] Done storyId={} sentences={} promptTokens={} completionTokens={} durationMs={}",
                storyId, vi.size(), chat.getPromptTokens(), chat.getCompletionTokens(), chat.getDurationMs());
    }
}
