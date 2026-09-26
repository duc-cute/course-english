package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.Story;
import com.courseenglish.api.domain.dto.story.StoryTranslationsPayloadDTO;
import com.courseenglish.api.domain.request.ReqStoryMonologuePreviewDTO;
import com.courseenglish.api.domain.response.ResMonologueThemeDTO;
import com.courseenglish.api.domain.response.ResStoryAiPreviewDTO;
import com.courseenglish.api.repository.StoryRepository;
import com.courseenglish.api.service.impl.OpenRouterClient;
import com.courseenglish.api.util.AppConstants;
import com.courseenglish.api.util.constant.StoryFormatEnum;
import com.courseenglish.api.util.constant.StoryVisualStyleEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Sinh truyện tự sự (MONOLOGUE) một chạm: admin chỉ chọn chủ đề / level / thời lượng,
 * BE tự ghép prompt từ {@link MonologueThemeCatalog}.
 */
@Service
public class AiMonologueStoryService {
    private static final Logger log = LoggerFactory.getLogger(AiMonologueStoryService.class);

    private static final Set<String> LEVELS = Set.of("A1", "A2", "B1", "B2", "C1", "C2");
    private static final int MIN_MINUTES = 1;
    private static final int MAX_MINUTES = 8;

    private static final String SYSTEM_PROMPT =
            """
            You write short inspirational "monologue" stories for Vietnamese learners of English.
            ONE warm narrator speaks directly to the reader. There is NO dialogue between characters.

            Return ONLY a single JSON object (no markdown, no commentary):
            {
              "title": "string — short English title (2-5 words)",
              "titleVi": "string — natural Vietnamese title",
              "content": "string — plain English text",
              "sentenceTranslations": ["string — Vietnamese translation of sentence 1", "..."],
              "glossary": [
                {
                  "word": "string",
                  "meaningVi": "string — short Vietnamese gloss",
                  "ipa": "string — IPA transcription (General American), no slashes, e.g. ˈkɒnfɪdəns",
                  "partOfSpeech": "noun | verb | adjective | adverb | phrase | ..."
                }
              ]
            }

            Structure of content (two parts, no headings):
            1. THE STORY (~60%): a small, concrete story told by the narrator
               (a memory, an ordinary person, or a parable). Short paragraphs separated by a blank line.
            2. THE MESSAGE (~40%): the narrator turns to the reader ("we" / "you") in five beats:
               pain (a feeling everyone knows) -> turn (starts with "But") -> reassurance
               -> one small action -> a memorable closing line that echoes the title.
               In this part put EACH sentence on its own line.

            Writing rules:
            - Warm, honest, simple. Not preachy, no clichés stacked together, no religion, politics,
              medical or mental-health advice.
            - Never use quotation marks or spoken dialogue.
            - Every sentence ends with . ! or ? — no ellipses (...), no abbreviations with dots (Mr., Dr., etc.).
            - Plain text only. Never HTML or markdown.
            - sentenceTranslations MUST have exactly one item per English sentence, same order.

            Vietnamese translation rules (important — quality matters more than literalness):
            - Write as a Vietnamese author would write this story for Vietnamese readers: warm, natural,
              idiomatic. Read the whole story first so each line fits the tone and flow of its neighbours.
            - Each item translates exactly ONE English sentence, but inside that sentence you may reorder
              clauses, change punctuation, drop pronouns ("you", "it", "we") where Vietnamese omits them,
              and use Vietnamese idioms. Never translate word by word.
            - Address the reader as "bạn"; keep sentences short and spoken, like a friend talking.
            - Example: "You write it down, say it aloud, and still it slips away."
              BAD: "Bạn viết nó ra, nói to lên, và nó vẫn trôi đi mất."
              GOOD: "Chép ra, đọc to lên, rồi nó vẫn cứ tuột khỏi đầu."
            - titleVi: write it like a real Vietnamese book title, not a literal translation.
            - glossary: 8-15 words or phrases from the story worth learning at this level.
              ipa: standard IPA for the base form; leave "" if unsure.
            """;

    private final OpenRouterClient openRouterClient;
    private final ObjectMapper objectMapper;
    private final StoryTranslationMergeService storyTranslationMergeService;
    private final StoryRepository storyRepository;
    private final StoryAiGenActivityLogger activityLogger;

    public AiMonologueStoryService(
            OpenRouterClient openRouterClient,
            ObjectMapper objectMapper,
            StoryTranslationMergeService storyTranslationMergeService,
            StoryRepository storyRepository,
            StoryAiGenActivityLogger activityLogger) {
        this.openRouterClient = openRouterClient;
        this.objectMapper = objectMapper;
        this.storyTranslationMergeService = storyTranslationMergeService;
        this.storyRepository = storyRepository;
        this.activityLogger = activityLogger;
    }

    public List<ResMonologueThemeDTO> listThemes() {
        return MonologueThemeCatalog.THEMES.stream()
                .map(t -> new ResMonologueThemeDTO(t.key(), t.name(), t.description()))
                .toList();
    }

    public ResStoryAiPreviewDTO preview(ReqStoryMonologuePreviewDTO request) throws IdInvalidException {
        String level = normalizeLevel(request.getLevel());
        int minutes = clampMinutes(request.getReadingTimeMinutes());
        MonologueThemeCatalog.Theme theme = resolveTheme(request.getThemeGroup());
        String angle = pickRandom(theme.angles());
        String storyShape = pickStoryShape(theme);
        int targetWords = wordsPerMinute(level) * minutes;
        List<String> recentTitles = storyRepository
                .findTop20ByStoryFormatAndVoidedFalseOrderByCreatedAtDesc(StoryFormatEnum.MONOLOGUE)
                .stream()
                .map(Story::getTitle)
                .toList();

        String userPrompt = buildUserPrompt(theme, angle, storyShape, level, minutes, targetWords, recentTitles);
        String model = AppConstants.aiVocabSetGenModel;
        log.info(
                "[StoryMonologue] Preview start model={} theme={} level={} minutes={} targetWords={} angle=\"{}\"",
                model, theme.key(), level, minutes, targetWords, angle);

        Map<String, Object> logContext =
                activityLogger.baseContext(StoryFormatEnum.MONOLOGUE.name(), model, level, minutes);
        logContext.put("themeGroup", theme.key());
        logContext.put("angle", angle);
        logContext.put("storyShape", storyShape);

        OpenRouterClient.ChatResult chat;
        try {
            chat = openRouterClient.chatJson(
                    model,
                    List.of(
                            Map.of("role", "system", "content", SYSTEM_PROMPT),
                            Map.of("role", "user", "content", userPrompt)),
                    AppConstants.aiVocabSetGenTimeoutSec);
        } catch (IdInvalidException ex) {
            activityLogger.failure(logContext, ex.getMessage(), null);
            throw ex;
        }

        try {
            JsonNode root = objectMapper.readTree(chat.getContent());
            String title = textOrBlank(root, "title");
            String content = textOrBlank(root, "content");
            if (title.isBlank() || content.isBlank()) {
                throw new IdInvalidException("AI không trả về title/content hợp lệ");
            }
            if (content.matches("(?s).*<\\s*/?\\s*[a-zA-Z][^>]*>.*")) {
                throw new IdInvalidException("Story không được chứa HTML");
            }

            StoryTranslationsPayloadDTO translations = storyTranslationMergeService.parseFromAi(root);
            String titleVi = textOrBlank(root, "titleVi");
            translations.setTitleVi(titleVi.isBlank() ? null : titleVi);

            ResStoryAiPreviewDTO dto = new ResStoryAiPreviewDTO();
            dto.setTitle(title);
            dto.setTitleVi(translations.getTitleVi());
            dto.setContent(content);
            dto.setLevel(level);
            dto.setReadingTimeMinutes(minutes);
            dto.setStoryFormat(StoryFormatEnum.MONOLOGUE.name());
            dto.setVisualStyle(StoryVisualStyleEnum.defaultFor(StoryFormatEnum.MONOLOGUE).name());
            dto.setThemeGroup(theme.key());
            dto.setPrompt("[MONOLOGUE] " + theme.name() + " — " + angle + " (" + storyShape + ")");
            dto.setTranslationsJson(objectMapper.writeValueAsString(translations));

            int wordCount = content.split("\\s+").length;
            log.info(
                    "[StoryMonologue] Preview success theme={} level={} words={}/{} sentenceVi={} glossary={} promptTokens={} completionTokens={} durationMs={}",
                    theme.key(), level, wordCount, targetWords,
                    translations.getSentenceTranslations().size(),
                    translations.getGlossary().size(),
                    chat.getPromptTokens(), chat.getCompletionTokens(), chat.getDurationMs());
            activityLogger.success(logContext, title, content, targetWords, translations, chat);
            return dto;
        } catch (IdInvalidException ex) {
            log.warn("[StoryMonologue] Preview validation failed reason={}", ex.getMessage());
            activityLogger.failure(logContext, ex.getMessage(), chat);
            throw ex;
        } catch (Exception ex) {
            log.error("[StoryMonologue] Preview parse failed error={}", ex.getMessage(), ex);
            activityLogger.failure(logContext, "Không phân tích được kết quả AI: " + ex.getMessage(), chat);
            throw new IdInvalidException("Không phân tích được kết quả AI: " + ex.getMessage());
        }
    }

    private String buildUserPrompt(
            MonologueThemeCatalog.Theme theme,
            String angle,
            String storyShape,
            String level,
            int minutes,
            int targetWords,
            List<String> recentTitles) {
        StringBuilder sb = new StringBuilder();
        sb.append("Write one monologue story.\n");
        sb.append("Theme: ").append(theme.description()).append("\n");
        sb.append("Angle: ").append(angle).append("\n");
        sb.append("Story part shape: ").append(storyShape).append("\n");
        sb.append("CEFR level: ").append(level).append(" — ").append(levelRules(level)).append("\n");
        sb.append("Length: about ").append(targetWords).append(" words (")
                .append(minutes).append(" minutes of reading for a ").append(level).append(" learner).\n");
        if (!recentTitles.isEmpty()) {
            sb.append("\nAvoid repeating these existing titles or their main idea:\n");
            for (String t : recentTitles) {
                sb.append("- ").append(t).append("\n");
            }
        }
        return sb.toString();
    }

    private static String levelRules(String level) {
        return switch (level) {
            case "A1" -> "sentences of 3-6 words, present simple only, the most common everyday words";
            case "A2" -> "sentences of 5-9 words, present and past simple, linking words like but, because, so";
            case "B1" -> "sentences of 8-14 words, some subordinate clauses and common collocations";
            case "B2" -> "varied sentence length, some idioms and vivid expressions";
            default -> "natural, rich language with idioms and figurative expressions";
        };
    }

    private static int wordsPerMinute(String level) {
        return switch (level) {
            case "A1" -> 70;
            case "A2" -> 90;
            case "B1" -> 110;
            case "B2" -> 130;
            default -> 150;
        };
    }

    private static String pickStoryShape(MonologueThemeCatalog.Theme theme) {
        if (MonologueThemeCatalog.PARABLE_KEY.equals(theme.key())) {
            return "a short parable from nature or daily life, told in third person, ending with its lesson";
        }
        return pickRandom(List.of(
                "a first-person memory of the narrator",
                "a short story about an ordinary person the narrator knows",
                "a short parable from nature or daily life"));
    }

    private static MonologueThemeCatalog.Theme resolveTheme(String key) throws IdInvalidException {
        if (key == null || key.isBlank()) {
            return pickRandom(MonologueThemeCatalog.THEMES);
        }
        return MonologueThemeCatalog.find(key)
                .orElseThrow(() -> new IdInvalidException("Chủ đề không hợp lệ: " + key));
    }

    private static String normalizeLevel(String level) {
        String normalized = level == null ? "" : level.trim().toUpperCase();
        return LEVELS.contains(normalized) ? normalized : "A2";
    }

    private static int clampMinutes(Integer minutes) {
        int value = minutes == null ? 3 : minutes;
        return Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, value));
    }

    private static <T> T pickRandom(List<T> items) {
        return items.get(ThreadLocalRandom.current().nextInt(items.size()));
    }

    private static String textOrBlank(JsonNode root, String field) {
        if (root == null || !root.has(field) || root.get(field).isNull()) {
            return "";
        }
        return root.get(field).asText("").trim();
    }
}
