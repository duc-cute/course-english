package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.dto.story.StoryTranslationsPayloadDTO;
import com.courseenglish.api.domain.request.ReqStoryAiPreviewDTO;
import com.courseenglish.api.domain.response.ResStoryAiPreviewDTO;
import com.courseenglish.api.domain.response.ResVocabularyItemDTO;
import com.courseenglish.api.domain.response.ResVocabularySetDTO;
import com.courseenglish.api.service.VocabularySetService;
import com.courseenglish.api.service.impl.OpenRouterClient;
import com.courseenglish.api.util.AppConstants;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AiStoryPreviewService {
    private static final Logger log = LoggerFactory.getLogger(AiStoryPreviewService.class);

    private static final String SYSTEM_PROMPT =
            """
            You are an English story author and bilingual editor for Vietnamese learners.
            Return ONLY a single JSON object (no markdown, no commentary) with this exact shape:
            {
              "title": "string — short story title in English",
              "content": "string — plain text story body in English only",
              "sentenceTranslations": ["string — Vietnamese translation of sentence 1", "..."],
              "glossary": [
                { "word": "string", "meaningVi": "string — short Vietnamese gloss" }
              ]
            }
            Rules:
            - content MUST be plain text paragraphs in English. Never HTML or markdown.
            - sentenceTranslations MUST have the SAME number of items as English sentences in content.
              Split English sentences by . ! ? boundaries (same order as they appear).
            - glossary: 8-25 useful words/phrases from the story with concise Vietnamese meanings.
            - Match the requested CEFR level and approximate reading time (word count).
            - If a vocabulary list is provided, weave those words naturally and include them in glossary.
            """;

    private final OpenRouterClient openRouterClient;
    private final ObjectMapper objectMapper;
    private final VocabularySetService vocabularySetService;
    private final StoryTranslationMergeService storyTranslationMergeService;

    public AiStoryPreviewService(
            OpenRouterClient openRouterClient,
            ObjectMapper objectMapper,
            VocabularySetService vocabularySetService,
            StoryTranslationMergeService storyTranslationMergeService) {
        this.openRouterClient = openRouterClient;
        this.objectMapper = objectMapper;
        this.vocabularySetService = vocabularySetService;
        this.storyTranslationMergeService = storyTranslationMergeService;
    }

    public ResStoryAiPreviewDTO preview(ReqStoryAiPreviewDTO request) throws IdInvalidException {
        String userPrompt = buildUserPrompt(request);
        String model = AppConstants.aiVocabSetGenModel;
        long timeoutSec = AppConstants.aiVocabSetGenTimeoutSec;
        log.info(
                "[StoryAI] Preview start model={} level={} readingTime={} vocabSetId={} promptLength={}",
                model,
                request.getLevel(),
                request.getReadingTimeMinutes(),
                request.getVocabularySetId(),
                request.getPrompt() == null ? 0 : request.getPrompt().trim().length());
        List<Map<String, String>> messages =
                List.of(
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user", "content", userPrompt));

        OpenRouterClient.ChatResult chat =
                openRouterClient.chatJson(
                        model, messages, timeoutSec);

        try {
            JsonNode root = objectMapper.readTree(chat.getContent());
            String title = textOrBlank(root, "title");
            String content = textOrBlank(root, "content");
            if (title.isBlank() || content.isBlank()) {
                throw new IdInvalidException("AI không trả về title/content hợp lệ");
            }
            if (content.contains("<") && content.contains(">")) {
                throw new IdInvalidException("Story không được chứa HTML");
            }

            ResStoryAiPreviewDTO dto = new ResStoryAiPreviewDTO();
            dto.setTitle(title.trim());
            dto.setContent(content.trim());
            dto.setLevel(request.getLevel());
            dto.setReadingTimeMinutes(request.getReadingTimeMinutes());

            StoryTranslationsPayloadDTO translations = storyTranslationMergeService.parseFromAi(root);
            try {
                dto.setTranslationsJson(objectMapper.writeValueAsString(translations));
            } catch (Exception ex) {
                log.warn("[StoryAI] Could not serialize translations: {}", ex.getMessage());
            }

            log.info(
                    "[StoryAI] Preview success model={} titleLength={} contentLength={} sentenceVi={} glossary={} promptTokens={} completionTokens={} durationMs={}",
                    model,
                    dto.getTitle().length(),
                    dto.getContent().length(),
                    translations.getSentenceTranslations().size(),
                    translations.getGlossary().size(),
                    chat.getPromptTokens(),
                    chat.getCompletionTokens(),
                    chat.getDurationMs());
            return dto;
        } catch (IdInvalidException ex) {
            log.warn("[StoryAI] Preview validation failed model={} reason={}", model, ex.getMessage());
            throw ex;
        } catch (Exception ex) {
            log.error("[StoryAI] Preview parse failed model={} error={}", model, ex.getMessage(), ex);
            throw new IdInvalidException("Không phân tích được kết quả AI: " + ex.getMessage());
        }
    }

    private String buildUserPrompt(ReqStoryAiPreviewDTO request) throws IdInvalidException {
        StringBuilder sb = new StringBuilder();
        sb.append("Write a story.\n");
        sb.append("Prompt: ").append(request.getPrompt().trim()).append("\n");
        sb.append("CEFR level: ").append(request.getLevel() != null ? request.getLevel() : "A2").append("\n");
        int minutes = request.getReadingTimeMinutes() != null ? request.getReadingTimeMinutes() : 5;
        sb.append("Target reading time: ").append(minutes).append(" minutes (~")
                .append(minutes * 120)
                .append(" words).\n");

        if (request.getVocabularySetId() != null) {
            ResVocabularySetDTO set = vocabularySetService.getById(request.getVocabularySetId());
            if (set.getItems() != null && !set.getItems().isEmpty()) {
                sb.append("\nInclude these vocabulary words naturally when possible:\n");
                for (ResVocabularyItemDTO item : set.getItems()) {
                    if (item.getWordEn() != null && !item.getWordEn().isBlank()) {
                        sb.append("- ").append(item.getWordEn().trim()).append("\n");
                    }
                }
            }
        }
        return sb.toString();
    }

    private static String textOrBlank(JsonNode root, String field) {
        if (root == null || !root.has(field) || root.get(field).isNull()) {
            return "";
        }
        return root.get(field).asText("");
    }
}
