package com.courseenglish.api.service.story;

import com.courseenglish.api.config.StorageProperties;
import com.courseenglish.api.domain.Story;
import com.courseenglish.api.domain.StoryScene;
import com.courseenglish.api.domain.dto.story.StoryCharacterProfileDTO;
import com.courseenglish.api.domain.dto.story.StoryVisualProfileDTO;
import com.courseenglish.api.domain.response.ResStoryIllustrationStatusDTO;
import com.courseenglish.api.repository.StoryRepository;
import com.courseenglish.api.repository.StorySceneRepository;
import com.courseenglish.api.service.ActivityLogService;
import com.courseenglish.api.service.FileService;
import com.courseenglish.api.service.activitylog.ActivityLogWriteContext;
import com.courseenglish.api.service.impl.OpenRouterClient;
import com.courseenglish.api.util.AppConstants;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.constant.ActivityLogActionEnum;
import com.courseenglish.api.util.constant.ActivityLogModuleEnum;
import com.courseenglish.api.util.constant.ActivityLogSeverityEnum;
import com.courseenglish.api.util.constant.StoryIllustrationStatusEnum;
import com.courseenglish.api.util.constant.StorySceneStatusEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
public class StoryIllustrationService {

    private static final Logger log = LoggerFactory.getLogger(StoryIllustrationService.class);
    private static final String SCENE_ASPECT = "4:3";
    private static final String CHAR_ASPECT = "1:1";
    private static final String NO_TEXT =
            " No text, letters, speech bubbles, captions, or watermarks in the image.";

    private final StoryRepository storyRepository;
    private final StorySceneRepository storySceneRepository;
    private final StorySceneAnalyzerService analyzerService;
    private final StoryIllustrationWorker illustrationWorker;
    private final OpenRouterClient openRouterClient;
    private final FileService fileService;
    private final StorageProperties storageProperties;
    private final ObjectMapper objectMapper;
    private final ActivityLogService activityLogService;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();

    public StoryIllustrationService(
            StoryRepository storyRepository,
            StorySceneRepository storySceneRepository,
            StorySceneAnalyzerService analyzerService,
            StoryIllustrationWorker illustrationWorker,
            OpenRouterClient openRouterClient,
            FileService fileService,
            StorageProperties storageProperties,
            ObjectMapper objectMapper,
            ActivityLogService activityLogService) {
        this.storyRepository = storyRepository;
        this.storySceneRepository = storySceneRepository;
        this.analyzerService = analyzerService;
        this.illustrationWorker = illustrationWorker;
        this.openRouterClient = openRouterClient;
        this.fileService = fileService;
        this.storageProperties = storageProperties;
        this.objectMapper = objectMapper;
        this.activityLogService = activityLogService;
    }

    @Transactional
    public ResStoryIllustrationStatusDTO queueGeneration(UUID storyId) throws IdInvalidException {
        Story story = requireStory(storyId);
        List<StoryScene> scenes = storySceneRepository.findByStoryIdAndVoidedFalseOrderBySceneIndexAsc(storyId);
        if (scenes.isEmpty()) {
            throw new IdInvalidException("Chưa phân tích scenes — gọi analyze trước");
        }
        UUID userId = SercurityUtil.getCurrentUserId().orElse(null);
        story.setIllustrationStatus(StoryIllustrationStatusEnum.GENERATING);
        story.setIllustrationLastError(null);
        storyRepository.save(story);

        writeActivityLog(
                ActivityLogSeverityEnum.INFO,
                ActivityLogActionEnum.STORY_IMG_QUEUE,
                "Đã xếp hàng sinh ảnh storybook — \"" + story.getTitle() + "\"",
                story,
                userId,
                null,
                "model", AppConstants.aiStoryIllustrationModel,
                "sceneCount", scenes.size());

        ResStoryIllustrationStatusDTO dto = analyzerService.getStatus(storyId);
        dto.setMessage("Đã xếp hàng sinh illustrations");
        illustrationWorker.generateAsync(storyId, userId);
        return dto;
    }

    public void generateAndPersist(UUID storyId) {
        generateAndPersist(storyId, null);
    }

    public void generateAndPersist(UUID storyId, UUID triggeredByUserId) {
        try {
            doGenerate(storyId, triggeredByUserId);
        } catch (Exception ex) {
            log.error("[StoryIllustration] Failed storyId={} reason={}", storyId, ex.getMessage(), ex);
            storyRepository.findByIdAndVoidedFalse(storyId).ifPresent(story -> {
                story.setIllustrationStatus(StoryIllustrationStatusEnum.FAILED);
                story.setIllustrationLastError(ex.getMessage());
                storyRepository.save(story);
                writeActivityLog(
                        ActivityLogSeverityEnum.ERROR,
                        ActivityLogActionEnum.STORY_IMG_FAIL,
                        "Sinh ảnh storybook thất bại — \"" + story.getTitle() + "\"",
                        story,
                        triggeredByUserId,
                        ex.getMessage(),
                        "model", AppConstants.aiStoryIllustrationModel);
            });
        }
    }

    @Transactional
    public ResStoryIllustrationStatusDTO regenerateScene(UUID storyId, int sceneIndex) throws IdInvalidException {
        Story story = requireStory(storyId);
        StoryScene scene = storySceneRepository
                .findByStoryIdAndSceneIndexAndVoidedFalse(storyId, sceneIndex)
                .orElseThrow(() -> new IdInvalidException("Scene không tồn tại"));
        UUID userId = SercurityUtil.getCurrentUserId().orElse(null);

        story.setIllustrationStatus(StoryIllustrationStatusEnum.GENERATING);
        story.setIllustrationLastError(null);
        storyRepository.save(story);

        writeActivityLog(
                ActivityLogSeverityEnum.INFO,
                ActivityLogActionEnum.STORY_IMG_REGEN,
                "Regenerate scene " + sceneIndex + " — \"" + story.getTitle() + "\"",
                story,
                userId,
                null,
                "sceneIndex", sceneIndex,
                "model", AppConstants.aiStoryIllustrationModel);

        try {
            List<StoryCharacterProfileDTO> characters = readCharacters(story.getCharactersJson());
            ensureCharacterSheets(story, characters, userId);
            generateOneScene(story, scene, characters);
            refreshStoryIllustrationStatus(story);
            writeActivityLog(
                    ActivityLogSeverityEnum.INFO,
                    ActivityLogActionEnum.STORY_IMG_READY,
                    "Regenerate scene " + sceneIndex + " xong — \"" + story.getTitle() + "\"",
                    story,
                    userId,
                    null,
                    "sceneIndex", sceneIndex,
                    "illustrationStatus", story.getIllustrationStatus().name());
            return analyzerService.getStatus(storyId);
        } catch (Exception e) {
            scene.setStatus(StorySceneStatusEnum.FAILED);
            scene.setErrorMessage(e.getMessage());
            storySceneRepository.save(scene);
            story.setIllustrationStatus(StoryIllustrationStatusEnum.FAILED);
            story.setIllustrationLastError(e.getMessage());
            storyRepository.save(story);
            writeActivityLog(
                    ActivityLogSeverityEnum.ERROR,
                    ActivityLogActionEnum.STORY_IMG_FAIL,
                    "Regenerate scene " + sceneIndex + " thất bại — \"" + story.getTitle() + "\"",
                    story,
                    userId,
                    e.getMessage(),
                    "sceneIndex", sceneIndex);
            throw new IdInvalidException("Regenerate scene thất bại: " + e.getMessage());
        }
    }

    private void doGenerate(UUID storyId, UUID triggeredByUserId) throws Exception {
        Story story = requireStory(storyId);
        List<StoryScene> scenes = storySceneRepository.findByStoryIdAndVoidedFalseOrderBySceneIndexAsc(storyId);
        if (scenes.isEmpty()) {
            throw new IdInvalidException("Không có scenes");
        }

        writeActivityLog(
                ActivityLogSeverityEnum.INFO,
                ActivityLogActionEnum.STORY_IMG_START,
                "Bắt đầu sinh ảnh storybook — \"" + story.getTitle() + "\"",
                story,
                triggeredByUserId,
                null,
                "model", AppConstants.aiStoryIllustrationModel,
                "sceneCount", scenes.size());

        List<StoryCharacterProfileDTO> characters = readCharacters(story.getCharactersJson());
        ensureCharacterSheets(story, characters, triggeredByUserId);

        int ready = 0;
        int failed = 0;
        for (StoryScene scene : scenes) {
            try {
                generateOneScene(story, scene, characters);
                ready++;
            } catch (Exception e) {
                failed++;
                scene.setStatus(StorySceneStatusEnum.FAILED);
                scene.setErrorMessage(e.getMessage());
                storySceneRepository.save(scene);
                log.warn(
                        "[StoryIllustration] Scene failed storyId={} sceneIndex={} reason={}",
                        storyId,
                        scene.getSceneIndex(),
                        e.getMessage());
                writeActivityLog(
                        ActivityLogSeverityEnum.ERROR,
                        ActivityLogActionEnum.STORY_IMG_FAIL,
                        "Scene " + scene.getSceneIndex() + " sinh ảnh thất bại — \"" + story.getTitle() + "\"",
                        story,
                        triggeredByUserId,
                        e.getMessage(),
                        "sceneIndex", scene.getSceneIndex(),
                        "model", AppConstants.aiStoryIllustrationModel);
            }
        }

        if (failed == 0 && ready > 0) {
            story.setIllustrationStatus(StoryIllustrationStatusEnum.READY);
            story.setIllustrationLastError(null);
            writeActivityLog(
                    ActivityLogSeverityEnum.INFO,
                    ActivityLogActionEnum.STORY_IMG_READY,
                    "Ảnh storybook sẵn sàng — \"" + story.getTitle() + "\" (" + ready + " scenes)",
                    story,
                    triggeredByUserId,
                    null,
                    "ready", ready,
                    "failed", failed,
                    "model", AppConstants.aiStoryIllustrationModel);
        } else if (ready > 0) {
            story.setIllustrationStatus(StoryIllustrationStatusEnum.PARTIAL);
            story.setIllustrationLastError(failed + " scene(s) failed");
            writeActivityLog(
                    ActivityLogSeverityEnum.WARN,
                    ActivityLogActionEnum.STORY_IMG_PARTIAL,
                    "Ảnh storybook một phần — \"" + story.getTitle() + "\" (ready=" + ready + ", failed=" + failed + ")",
                    story,
                    triggeredByUserId,
                    story.getIllustrationLastError(),
                    "ready", ready,
                    "failed", failed,
                    "model", AppConstants.aiStoryIllustrationModel);
        } else {
            story.setIllustrationStatus(StoryIllustrationStatusEnum.FAILED);
            story.setIllustrationLastError("All scenes failed");
            writeActivityLog(
                    ActivityLogSeverityEnum.ERROR,
                    ActivityLogActionEnum.STORY_IMG_FAIL,
                    "Sinh ảnh storybook thất bại toàn bộ — \"" + story.getTitle() + "\"",
                    story,
                    triggeredByUserId,
                    story.getIllustrationLastError(),
                    "ready", ready,
                    "failed", failed,
                    "model", AppConstants.aiStoryIllustrationModel);
        }
        storyRepository.save(story);
        log.info(
                "[StoryIllustration] Done storyId={} ready={} failed={} status={}",
                storyId,
                ready,
                failed,
                story.getIllustrationStatus());
    }

    private void ensureCharacterSheets(
            Story story, List<StoryCharacterProfileDTO> characters, UUID userId) throws Exception {
        if (characters == null || characters.isEmpty()) {
            return;
        }
        StoryVisualProfileDTO visual = readVisual(story.getVisualProfileJson());
        boolean changed = false;
        for (StoryCharacterProfileDTO character : characters) {
            if (character.getReferenceImageUrl() != null && !character.getReferenceImageUrl().isBlank()) {
                continue;
            }
            String prompt = buildCharacterPrompt(character, visual);
            log.info(
                    "[StoryIllustration] Character sheet storyId={} name={} model={}",
                    story.getId(),
                    character.getName(),
                    AppConstants.aiStoryIllustrationModel);
            OpenRouterClient.ImageGenResult gen = openRouterClient.generateImage(
                    AppConstants.aiStoryIllustrationModel,
                    prompt,
                    AppConstants.aiStoryIllustrationTimeoutSec,
                    CHAR_ASPECT);
            byte[] bytes = resolveImageBytes(gen);
            String folder = "stories/" + story.getId() + "/characters";
            String fileName = sanitizeFileName(character.getName()) + "-" + UUID.randomUUID() + ".png";
            fileService.storeBytes(bytes, folder, fileName);
            character.setReferenceImageUrl("/storage/" + folder + "/" + fileName);
            changed = true;
            writeActivityLog(
                    ActivityLogSeverityEnum.INFO,
                    ActivityLogActionEnum.STORY_IMG_START,
                    "Đã sinh character sheet — " + character.getName(),
                    story,
                    userId,
                    null,
                    "character", character.getName(),
                    "referenceImageUrl", character.getReferenceImageUrl(),
                    "model", AppConstants.aiStoryIllustrationModel);
        }
        if (changed) {
            story.setCharactersJson(objectMapper.writeValueAsString(characters));
            storyRepository.save(story);
        }
    }

    private void generateOneScene(
            Story story, StoryScene scene, List<StoryCharacterProfileDTO> characters) throws Exception {
        StoryVisualProfileDTO visual = readVisual(story.getVisualProfileJson());
        String prompt = buildScenePrompt(scene, characters, visual);
        List<String> refs = collectReferenceDataUrls(scene, characters);

        log.info(
                "[StoryIllustration] Scene image storyId={} sceneIndex={} model={} refs={}",
                story.getId(),
                scene.getSceneIndex(),
                AppConstants.aiStoryIllustrationModel,
                refs.size());

        OpenRouterClient.ImageGenResult gen = openRouterClient.generateImage(
                AppConstants.aiStoryIllustrationModel,
                prompt,
                AppConstants.aiStoryIllustrationTimeoutSec,
                SCENE_ASPECT,
                refs.isEmpty() ? null : refs);

        byte[] bytes = resolveImageBytes(gen);
        String folder = "stories/" + story.getId() + "/scenes";
        String fileName = "scene-" + scene.getSceneIndex() + "-" + UUID.randomUUID() + ".png";
        fileService.storeBytes(bytes, folder, fileName);

        scene.setImageUrl("/storage/" + folder + "/" + fileName);
        scene.setImagePrompt(prompt);
        scene.setStatus(StorySceneStatusEnum.READY);
        scene.setErrorMessage(null);
        storySceneRepository.save(scene);
    }

    private void refreshStoryIllustrationStatus(Story story) {
        List<StoryScene> scenes =
                storySceneRepository.findByStoryIdAndVoidedFalseOrderBySceneIndexAsc(story.getId());
        long ready = scenes.stream().filter(s -> s.getStatus() == StorySceneStatusEnum.READY).count();
        long failed = scenes.stream().filter(s -> s.getStatus() == StorySceneStatusEnum.FAILED).count();
        if (ready == scenes.size() && ready > 0) {
            story.setIllustrationStatus(StoryIllustrationStatusEnum.READY);
            story.setIllustrationLastError(null);
        } else if (ready > 0) {
            story.setIllustrationStatus(StoryIllustrationStatusEnum.PARTIAL);
            story.setIllustrationLastError(failed + " scene(s) not ready");
        } else {
            story.setIllustrationStatus(StoryIllustrationStatusEnum.FAILED);
        }
        storyRepository.save(story);
    }

    private String buildCharacterPrompt(StoryCharacterProfileDTO c, StoryVisualProfileDTO visual) {
        StringBuilder sb = new StringBuilder();
        sb.append("Character reference sheet, full body front view, plain background. ");
        sb.append("Name context only for appearance: ").append(nullToEmpty(c.getName())).append(". ");
        if (c.getAge() != null) {
            sb.append("Age ").append(c.getAge()).append(". ");
        }
        sb.append(nullToEmpty(c.getGender())).append(". ");
        sb.append("Hair: ").append(nullToEmpty(c.getHair())).append(". ");
        sb.append("Clothing: ").append(nullToEmpty(c.getClothing())).append(". ");
        sb.append("Appearance: ").append(nullToEmpty(c.getAppearance())).append(". ");
        if (visual != null) {
            sb.append("Art style: ").append(nullToEmpty(visual.getArtStyle())).append(". ");
            sb.append("Colors: ").append(nullToEmpty(visual.getColorStyle())).append(". ");
        } else {
            sb.append("Art style: ").append(nullToEmpty(c.getArtStyle())).append(". ");
        }
        sb.append(NO_TEXT);
        return sb.toString();
    }

    private String buildScenePrompt(
            StoryScene scene, List<StoryCharacterProfileDTO> characters, StoryVisualProfileDTO visual) {
        StringBuilder sb = new StringBuilder();
        sb.append("Illustrated storybook page, 4:3 landscape. ");
        if (scene.getImagePrompt() != null && !scene.getImagePrompt().isBlank()) {
            sb.append(scene.getImagePrompt().trim()).append(' ');
        } else if (scene.getDescription() != null) {
            sb.append(scene.getDescription().trim()).append(' ');
        }
        if (visual != null) {
            sb.append("Art style: ").append(nullToEmpty(visual.getArtStyle())).append(". ");
            sb.append("Color: ").append(nullToEmpty(visual.getColorStyle())).append(". ");
            sb.append("Lighting: ").append(nullToEmpty(visual.getLighting())).append(". ");
            sb.append("Mood: ").append(nullToEmpty(visual.getMood())).append(". ");
        }
        List<String> namesInScene = readStringList(scene.getCharactersJson());
        if (!namesInScene.isEmpty() && characters != null) {
            sb.append("Keep character appearance consistent with reference images. Characters: ");
            for (String name : namesInScene) {
                characters.stream()
                        .filter(c -> name.equalsIgnoreCase(c.getName()))
                        .findFirst()
                        .ifPresent(c -> sb.append(c.getName())
                                .append(" (")
                                .append(nullToEmpty(c.getHair()))
                                .append(", ")
                                .append(nullToEmpty(c.getClothing()))
                                .append("); "));
            }
        }
        if (!sb.toString().toLowerCase().contains("no text")) {
            sb.append(NO_TEXT);
        }
        return sb.toString().trim();
    }

    private List<String> collectReferenceDataUrls(
            StoryScene scene, List<StoryCharacterProfileDTO> characters) throws IOException {
        List<String> refs = new ArrayList<>();
        if (characters == null || characters.isEmpty()) {
            return refs;
        }
        List<String> names = readStringList(scene.getCharactersJson());
        for (StoryCharacterProfileDTO c : characters) {
            if (c.getReferenceImageUrl() == null || c.getReferenceImageUrl().isBlank()) {
                continue;
            }
            if (!names.isEmpty()
                    && names.stream().noneMatch(n -> n.equalsIgnoreCase(nullToEmpty(c.getName())))) {
                continue;
            }
            String dataUrl = toDataUrl(c.getReferenceImageUrl());
            if (dataUrl != null) {
                refs.add(dataUrl);
            }
            if (refs.size() >= 4) {
                break;
            }
        }
        return refs;
    }

    private String toDataUrl(String storageUrl) throws IOException {
        String relative = storageUrl;
        if (relative.startsWith("/storage/")) {
            relative = relative.substring("/storage/".length());
        }
        var path = storageProperties.getRootPath().resolve(relative).normalize();
        if (!path.startsWith(storageProperties.getRootPath()) || !Files.exists(path)) {
            return null;
        }
        byte[] bytes = Files.readAllBytes(path);
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes);
    }

    private byte[] resolveImageBytes(OpenRouterClient.ImageGenResult gen) throws IdInvalidException, IOException, InterruptedException {
        if (gen.getB64Json() != null && !gen.getB64Json().isBlank()) {
            return Base64.getDecoder().decode(gen.getB64Json());
        }
        if (gen.getUrl() == null || gen.getUrl().isBlank()) {
            throw new IdInvalidException("AI không trả ảnh");
        }
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(gen.getUrl()))
                .timeout(Duration.ofSeconds(60))
                .GET()
                .build();
        HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() >= 400) {
            throw new IdInvalidException("Tải ảnh gen thất bại HTTP " + response.statusCode());
        }
        return response.body();
    }

    private Story requireStory(UUID storyId) throws IdInvalidException {
        return storyRepository
                .findByIdAndVoidedFalse(storyId)
                .orElseThrow(() -> new IdInvalidException("Story không tồn tại"));
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

    private List<String> readStringList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            List<String> list = objectMapper.readValue(json, new TypeReference<>() {});
            return list != null ? list : List.of();
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private static String sanitizeFileName(String name) {
        if (name == null || name.isBlank()) {
            return "character";
        }
        return name.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-");
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s.trim();
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
                        .put("storySlug", story.getSlug())
                        .put("illustrationStatus",
                                story.getIllustrationStatus() != null
                                        ? story.getIllustrationStatus().name()
                                        : null);
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
