package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.Story;
import com.courseenglish.api.domain.StoryScene;
import com.courseenglish.api.domain.dto.story.StoryCharacterProfileDTO;
import com.courseenglish.api.domain.dto.story.StorySceneDTO;
import com.courseenglish.api.domain.dto.story.StorySceneSegmentDTO;
import com.courseenglish.api.domain.dto.story.StorySentenceDTO;
import com.courseenglish.api.domain.dto.story.StoryTokensPayloadDTO;
import com.courseenglish.api.domain.dto.story.StoryVisualProfileDTO;
import com.courseenglish.api.domain.response.ResStoryIllustrationStatusDTO;
import com.courseenglish.api.repository.StoryRepository;
import com.courseenglish.api.repository.StorySceneRepository;
import com.courseenglish.api.service.ActivityLogService;
import com.courseenglish.api.service.activitylog.ActivityLogWriteContext;
import com.courseenglish.api.service.impl.OpenRouterClient;
import com.courseenglish.api.util.AppConstants;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.constant.ActivityLogActionEnum;
import com.courseenglish.api.util.constant.ActivityLogModuleEnum;
import com.courseenglish.api.util.constant.ActivityLogSeverityEnum;
import com.courseenglish.api.util.constant.StoryFormatEnum;
import com.courseenglish.api.util.constant.StoryIllustrationStatusEnum;
import com.courseenglish.api.util.constant.StorySceneStatusEnum;
import com.courseenglish.api.util.constant.StoryVisualStyleEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
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

@Service
public class StorySceneAnalyzerService {

    private static final Logger log = LoggerFactory.getLogger(StorySceneAnalyzerService.class);

    private static final String STORYBOOK_SYSTEM_PROMPT =
            """
            You are a storyboard director for an illustrated English learning storybook.
            Return ONLY one JSON object (no markdown) with this shape:
            {
              "characters": [
                {
                  "name": "Emma",
                  "age": 16,
                  "gender": "female",
                  "hair": "long brown hair",
                  "clothing": "yellow hoodie and blue jeans",
                  "appearance": "friendly teenage girl",
                  "artStyle": "modern 2D educational illustration",
                  "colorStyle": "soft pastel colors"
                }
              ],
              "scenes": [
                {
                  "sceneIndex": 1,
                  "sentenceStart": 0,
                  "sentenceEnd": 2,
                  "description": "short visual description",
                  "location": "bookstore",
                  "characters": ["Emma"],
                  "segments": [
                    { "type": "narration", "text": "..." },
                    { "type": "dialogue", "speaker": "Emma", "text": "..." }
                  ],
                  "imagePrompt": "detailed illustration prompt, no text in image"
                }
              ]
            }
            Rules:
            - Create 4-6 scenes for a typical 400-500 word story (about 80-120 words per scene).
            - sentenceStart/sentenceEnd are 0-based indexes into the provided sentences list (inclusive).
            - Scenes must cover the whole story without gaps or overlaps.
            - segments: split narration vs spoken dialogue; dialogue MUST include speaker.
            - imagePrompt: vivid scene for image gen; MUST say no text, letters, speech bubbles, captions, watermarks.
            - Keep character appearance consistent across characters[] and imagePrompt.
            """;

    private static final String MONOLOGUE_SYSTEM_PROMPT =
            """
            You are an art director for a reflective, inspirational English learning story.
            One narrator speaks to the reader; there is no dialogue. Images are METAPHORS, not literal.
            Return ONLY one JSON object (no markdown) with this shape:
            {
              "characters": [
                {
                  "name": "Everyman",
                  "gender": "neutral",
                  "hair": "short, mostly hidden under a small hat",
                  "clothing": "simple shirt and trousers",
                  "appearance": "simple round-headed figure with calm dot eyes"
                }
              ],
              "scenes": [
                {
                  "sceneIndex": 1,
                  "sentenceStart": 0,
                  "sentenceEnd": 3,
                  "location": "park bench",
                  "characters": ["Everyman"],
                  "imagePrompt": "one sentence, max 25 words: a visual metaphor for this part"
                }
              ]
            }
            Rules:
            - Create 5-6 scenes; sentenceStart/sentenceEnd are 0-based inclusive indexes into the sentences list.
            - Scenes must cover the whole story in order without gaps or overlaps.
            - characters: at most ONE simple anonymous figure representing the reader (or none for a nature parable).
              If the story part is about a specific person or animal, describe them instead, still simple.
            - imagePrompt: ONE short sentence (max 25 words) — a clear visual metaphor for the feeling of that part
              (e.g. rain clouds turning into sun, a small plant breaking through stone). One focal subject, empty space.
              Do NOT describe art style, colors, lighting or "no text" — the system appends those. Keep it short.
            - Omit "description"; the imagePrompt is enough.
            """;

    private final StoryRepository storyRepository;
    private final StorySceneRepository storySceneRepository;
    private final OpenRouterClient openRouterClient;
    private final ObjectMapper objectMapper;
    private final ActivityLogService activityLogService;

    public StorySceneAnalyzerService(
            StoryRepository storyRepository,
            StorySceneRepository storySceneRepository,
            OpenRouterClient openRouterClient,
            ObjectMapper objectMapper,
            ActivityLogService activityLogService) {
        this.storyRepository = storyRepository;
        this.storySceneRepository = storySceneRepository;
        this.openRouterClient = openRouterClient;
        this.objectMapper = objectMapper;
        this.activityLogService = activityLogService;
    }

    @Transactional(rollbackFor = Exception.class)
    public ResStoryIllustrationStatusDTO analyze(UUID storyId) throws IdInvalidException {
        Story story = storyRepository.findByIdAndVoidedFalse(storyId)
                .orElseThrow(() -> new IdInvalidException("Story không tồn tại"));
        if (story.getContent() == null || story.getContent().isBlank()) {
            throw new IdInvalidException("Story chưa có nội dung");
        }

        List<StorySentenceDTO> sentences = readSentences(story);
        String userPrompt;
        try {
            userPrompt = buildUserPrompt(story, sentences);
        } catch (JsonProcessingException e) {
            throw new IdInvalidException("Không tạo được prompt phân tích scene");
        }
        boolean monologue = story.getStoryFormat() == StoryFormatEnum.MONOLOGUE;
        log.info(
                "[StoryScene] Analyze start storyId={} format={} sentenceCount={}",
                storyId, story.getStoryFormat(), sentences.size());

        OpenRouterClient.ChatResult chat = openRouterClient.chatJson(
                AppConstants.aiVocabSetGenModel,
                List.of(
                        Map.of("role", "system", "content",
                                monologue ? MONOLOGUE_SYSTEM_PROMPT : STORYBOOK_SYSTEM_PROMPT),
                        Map.of("role", "user", "content", userPrompt)),
                AppConstants.aiVocabSetGenTimeoutSec);

        try {
            JsonNode root = objectMapper.readTree(chat.getContent());
            JsonNode scenesNode = root.path("scenes");
            if (!scenesNode.isArray() || scenesNode.isEmpty()) {
                throw new IdInvalidException("AI không trả scenes hợp lệ");
            }
            StoryVisualProfileDTO visual = visualProfileOf(story);
            List<StoryCharacterProfileDTO> characters = objectMapper.convertValue(
                    root.path("characters"),
                    new TypeReference<List<StoryCharacterProfileDTO>>() {});
            if (characters == null) {
                characters = new ArrayList<>();
            }

            List<StoryScene> existing = storySceneRepository.findByStoryIdAndVoidedFalseOrderBySceneIndexAsc(storyId);
            for (StoryScene scene : existing) {
                scene.setVoided(true);
            }
            storySceneRepository.saveAll(existing);

            int maxSentence = Math.max(0, sentences.size() - 1);
            List<StoryScene> saved = new ArrayList<>();
            for (JsonNode sceneNode : scenesNode) {
                StoryScene scene = new StoryScene();
                scene.setStoryId(storyId);
                scene.setSceneIndex(sceneNode.path("sceneIndex").asInt(saved.size() + 1));
                int start = sceneNode.path("sentenceStart").asInt(0);
                int end = sceneNode.path("sentenceEnd").asInt(start);
                scene.setSentenceStart(clamp(start, 0, maxSentence));
                scene.setSentenceEnd(clamp(Math.max(end, start), 0, maxSentence));
                String description = textOrBlank(sceneNode, "description");
                if (description.isBlank()) {
                    // MONOLOGUE prompt bỏ description để rút ngắn output — dùng imagePrompt cho UI
                    description = textOrBlank(sceneNode, "imagePrompt");
                }
                scene.setDescription(description);
                scene.setLocation(textOrBlank(sceneNode, "location"));
                scene.setCharactersJson(objectMapper.writeValueAsString(
                        objectMapper.convertValue(
                                sceneNode.path("characters"),
                                new TypeReference<List<String>>() {})));
                List<StorySceneSegmentDTO> segments = monologue
                        ? null
                        : objectMapper.convertValue(
                                sceneNode.path("segments"),
                                new TypeReference<List<StorySceneSegmentDTO>>() {});
                if (segments == null || segments.isEmpty()) {
                    segments = fallbackSegments(sentences, scene.getSentenceStart(), scene.getSentenceEnd());
                }
                scene.setSegmentsJson(objectMapper.writeValueAsString(segments));
                String imagePrompt = textOrBlank(sceneNode, "imagePrompt");
                if (imagePrompt.isBlank()) {
                    imagePrompt = scene.getDescription();
                }
                scene.setImagePrompt(appendNoTextRule(imagePrompt));
                scene.setStatus(StorySceneStatusEnum.PENDING);
                saved.add(storySceneRepository.save(scene));
            }

            story.setVisualProfileJson(objectMapper.writeValueAsString(visual));
            story.setCharactersJson(objectMapper.writeValueAsString(characters));
            story.setIllustrationStatus(StoryIllustrationStatusEnum.ANALYZED);
            story.setIllustrationLastError(null);
            storyRepository.save(story);

            log.info(
                    "[StoryScene] Analyze done storyId={} scenes={} model={} aiDurationMs={} promptTokens={} completionTokens={}",
                    storyId, saved.size(), AppConstants.aiVocabSetGenModel,
                    chat.getDurationMs(), chat.getPromptTokens(), chat.getCompletionTokens());
            UUID userId = SercurityUtil.getCurrentUserId().orElse(null);
            writeActivityLog(
                    ActivityLogSeverityEnum.INFO,
                    ActivityLogActionEnum.STORY_SCENE_ANLZ,
                    "Đã phân tích scenes — \"" + story.getTitle() + "\" (" + saved.size() + " scenes)",
                    story,
                    userId,
                    null,
                    "sceneCount", saved.size(),
                    "characterCount", characters.size(),
                    "model", AppConstants.aiVocabSetGenModel,
                    "aiDurationMs", chat.getDurationMs(),
                    "promptTokens", chat.getPromptTokens(),
                    "completionTokens", chat.getCompletionTokens());
            return toStatusDto(story, characters, visual, saved);
        } catch (IdInvalidException e) {
            storyRepository.findByIdAndVoidedFalse(storyId).ifPresent(s -> {
                UUID userId = SercurityUtil.getCurrentUserId().orElse(null);
                writeActivityLog(
                        ActivityLogSeverityEnum.ERROR,
                        ActivityLogActionEnum.STORY_SCENE_ANLZ,
                        "Phân tích scenes thất bại — \"" + s.getTitle() + "\"",
                        s,
                        userId,
                        e.getMessage());
            });
            throw e;
        } catch (Exception e) {
            log.error("[StoryScene] Analyze failed storyId={}", storyId, e);
            storyRepository.findByIdAndVoidedFalse(storyId).ifPresent(s -> {
                UUID userId = SercurityUtil.getCurrentUserId().orElse(null);
                writeActivityLog(
                        ActivityLogSeverityEnum.ERROR,
                        ActivityLogActionEnum.STORY_SCENE_ANLZ,
                        "Phân tích scenes thất bại — \"" + s.getTitle() + "\"",
                        s,
                        userId,
                        e.getMessage());
            });
            throw new IdInvalidException("Phân tích scene thất bại: " + e.getMessage());
        }
    }

    public ResStoryIllustrationStatusDTO getStatus(UUID storyId) throws IdInvalidException {
        Story story = storyRepository.findByIdAndVoidedFalse(storyId)
                .orElseThrow(() -> new IdInvalidException("Story không tồn tại"));
        List<StoryScene> scenes = storySceneRepository.findByStoryIdAndVoidedFalseOrderBySceneIndexAsc(storyId);
        return toStatusDto(
                story,
                readCharacters(story.getCharactersJson()),
                readVisual(story.getVisualProfileJson()),
                scenes);
    }

    public List<StorySceneDTO> toSceneDtos(List<StoryScene> scenes) {
        List<StorySceneDTO> list = new ArrayList<>();
        for (StoryScene scene : scenes) {
            list.add(toSceneDto(scene));
        }
        return list;
    }

    public StorySceneDTO toSceneDto(StoryScene scene) {
        StorySceneDTO dto = new StorySceneDTO();
        dto.setId(scene.getId());
        dto.setSceneIndex(scene.getSceneIndex());
        dto.setSentenceStart(scene.getSentenceStart());
        dto.setSentenceEnd(scene.getSentenceEnd());
        dto.setDescription(scene.getDescription());
        dto.setLocation(scene.getLocation());
        dto.setImagePrompt(scene.getImagePrompt());
        dto.setImageUrl(scene.getImageUrl());
        dto.setStatus(scene.getStatus() != null ? scene.getStatus().name() : null);
        try {
            if (scene.getCharactersJson() != null && !scene.getCharactersJson().isBlank()) {
                dto.setCharacters(objectMapper.readValue(
                        scene.getCharactersJson(), new TypeReference<List<String>>() {}));
            }
            if (scene.getSegmentsJson() != null && !scene.getSegmentsJson().isBlank()) {
                dto.setSegments(objectMapper.readValue(
                        scene.getSegmentsJson(), new TypeReference<List<StorySceneSegmentDTO>>() {}));
            }
        } catch (JsonProcessingException ignored) {
            // keep empty lists
        }
        return dto;
    }

    private ResStoryIllustrationStatusDTO toStatusDto(
            Story story,
            List<StoryCharacterProfileDTO> characters,
            StoryVisualProfileDTO visual,
            List<StoryScene> scenes) {
        ResStoryIllustrationStatusDTO dto = new ResStoryIllustrationStatusDTO();
        dto.setStoryId(story.getId());
        dto.setIllustrationStatus(
                story.getIllustrationStatus() != null
                        ? story.getIllustrationStatus().name()
                        : StoryIllustrationStatusEnum.NONE.name());
        dto.setErrorMessage(story.getIllustrationLastError());
        dto.setVisualProfile(visual);
        dto.setCharacters(characters != null ? characters : new ArrayList<>());
        dto.setScenes(toSceneDtos(scenes));
        return dto;
    }

    private String buildUserPrompt(Story story, List<StorySentenceDTO> sentences) throws JsonProcessingException {
        StringBuilder sb = new StringBuilder();
        sb.append("Title: ").append(story.getTitle()).append("\n");
        sb.append("Level: ").append(story.getLevel() == null ? "B1" : story.getLevel()).append("\n");
        sb.append("Full story:\n").append(story.getContent().trim()).append("\n\n");
        sb.append("Sentences (use these indexes):\n");
        for (StorySentenceDTO s : sentences) {
            sb.append(s.getSentenceIndex())
                    .append(": ")
                    .append(s.getText() == null ? "" : s.getText())
                    .append("\n");
        }
        return sb.toString();
    }

    private List<StorySentenceDTO> readSentences(Story story) throws IdInvalidException {
        if (story.getTokensJson() == null || story.getTokensJson().isBlank()) {
            throw new IdInvalidException("Story chưa tokenize — lưu story trước khi phân tích scene");
        }
        try {
            StoryTokensPayloadDTO payload =
                    objectMapper.readValue(story.getTokensJson(), StoryTokensPayloadDTO.class);
            if (payload.getSentences() == null || payload.getSentences().isEmpty()) {
                throw new IdInvalidException("Story không có sentences để chia scene");
            }
            return payload.getSentences();
        } catch (JsonProcessingException e) {
            throw new IdInvalidException("Không đọc được tokens story");
        }
    }

    private List<StorySceneSegmentDTO> fallbackSegments(
            List<StorySentenceDTO> sentences, int start, int end) {
        StringBuilder text = new StringBuilder();
        for (StorySentenceDTO s : sentences) {
            if (s.getSentenceIndex() >= start && s.getSentenceIndex() <= end) {
                if (text.length() > 0) {
                    text.append(' ');
                }
                text.append(s.getText());
            }
        }
        StorySceneSegmentDTO seg = new StorySceneSegmentDTO();
        seg.setType("narration");
        seg.setText(text.toString().trim());
        return List.of(seg);
    }

    /** Phong cách ảnh cố định theo stories.visual_style (không để AI tự chọn). */
    private static StoryVisualProfileDTO visualProfileOf(Story story) {
        StoryVisualStyleEnum style = story.getVisualStyle() != null
                ? story.getVisualStyle()
                : StoryVisualStyleEnum.defaultFor(story.getStoryFormat());
        StoryVisualProfileDTO visual = new StoryVisualProfileDTO();
        visual.setArtStyle(style.getArtStyle());
        visual.setColorStyle(style.getColorStyle());
        visual.setLighting(style.getLighting());
        visual.setMood(style.getMood());
        return visual;
    }

    private List<StoryCharacterProfileDTO> readCharacters(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }

    private StoryVisualProfileDTO readVisual(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, StoryVisualProfileDTO.class);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private static String appendNoTextRule(String prompt) {
        String base = prompt == null ? "" : prompt.trim();
        if (base.toLowerCase().contains("no text")) {
            return base;
        }
        return base + " No text, letters, speech bubbles, captions, or watermarks in the image.";
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private static String textOrBlank(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return v == null || v.isNull() ? "" : v.asText("").trim();
    }

    private void writeActivityLog(
            ActivityLogSeverityEnum severity,
            ActivityLogActionEnum action,
            String message,
            Story story,
            UUID userId,
            String detail,
            Object... contextPairs) {
        ActivityLogWriteContext ctx =
                ActivityLogWriteContext.of(severity, ActivityLogModuleEnum.STORY, action, message)
                        .ref("STORY", story.getId())
                        .put("storyId", story.getId())
                        .put("storyTitle", story.getTitle())
                        .put("storySlug", story.getSlug());
        if (userId != null) {
            ctx.userId(userId);
        }
        if (detail != null && !detail.isBlank()) {
            ctx.detail(detail);
        }
        for (int i = 0; i + 1 < contextPairs.length; i += 2) {
            Object key = contextPairs[i];
            Object value = contextPairs[i + 1];
            if (key instanceof String keyStr) {
                ctx.put(keyStr, value);
            }
        }
        activityLogService.log(ctx);
    }
}
