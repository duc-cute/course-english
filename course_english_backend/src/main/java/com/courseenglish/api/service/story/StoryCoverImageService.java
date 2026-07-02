package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.request.ReqStoryCoverPreviewDTO;
import com.courseenglish.api.domain.response.ResStoryCoverPreviewDTO;
import com.courseenglish.api.service.FileService;
import com.courseenglish.api.service.impl.OpenRouterClient;
import com.courseenglish.api.util.AppConstants;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class StoryCoverImageService {

    private static final Logger log = LoggerFactory.getLogger(StoryCoverImageService.class);
    private static final String STORAGE_FOLDER = "stories/covers";
    private static final String ASPECT_RATIO = "16:9";

    private final OpenRouterClient openRouterClient;
    private final FileService fileService;
    private final StoryCoverPromptAssembler coverPromptAssembler;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();

    public StoryCoverImageService(
            OpenRouterClient openRouterClient,
            FileService fileService,
            StoryCoverPromptAssembler coverPromptAssembler,
            ObjectMapper objectMapper) {
        this.openRouterClient = openRouterClient;
        this.fileService = fileService;
        this.coverPromptAssembler = coverPromptAssembler;
        this.objectMapper = objectMapper;
    }

    public ResStoryCoverPreviewDTO preview(ReqStoryCoverPreviewDTO request) throws IdInvalidException {
        validateRequest(request);

        String imagePrompt = buildImagePromptViaLlm(request);
        log.info(
                "[StoryCover] Generating image title={} aspectRatio={} promptLength={}",
                request.getTitle(),
                ASPECT_RATIO,
                imagePrompt.length());

        OpenRouterClient.ImageGenResult gen = openRouterClient.generateImage(
                AppConstants.aiVocabSetCoverImageModel,
                imagePrompt,
                AppConstants.aiVocabSetCoverImageTimeoutSec,
                ASPECT_RATIO);

        byte[] imageBytes = resolveImageBytes(gen);
        String fileName = UUID.randomUUID() + ".png";
        try {
            fileService.storeBytes(imageBytes, STORAGE_FOLDER, fileName);
        } catch (IOException e) {
            throw new IdInvalidException("Không lưu được ảnh cover story: " + e.getMessage());
        }

        ResStoryCoverPreviewDTO dto = new ResStoryCoverPreviewDTO();
        dto.setCoverImageUrl("/storage/" + STORAGE_FOLDER + "/" + fileName);
        dto.setCoverImagePrompt(imagePrompt);
        return dto;
    }

    private void validateRequest(ReqStoryCoverPreviewDTO request) throws IdInvalidException {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IdInvalidException("Tiêu đề story không được để trống");
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new IdInvalidException("Nội dung story không được để trống — cần đọc story để sinh ảnh có chiều sâu");
        }
    }

    private String buildImagePromptViaLlm(ReqStoryCoverPreviewDTO request) throws IdInvalidException {
        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", coverPromptAssembler.buildSystemPrompt()),
                Map.of("role", "user", "content", coverPromptAssembler.buildUserPrompt(request)));

        OpenRouterClient.ChatResult chat = openRouterClient.chatJson(
                AppConstants.aiVocabSetGenModel,
                messages,
                AppConstants.aiVocabSetGenTimeoutSec);

        try {
            JsonNode root = objectMapper.readTree(chat.getContent());
            String coverImagePrompt = textOrBlank(root, "coverImagePrompt");
            if (coverImagePrompt.isBlank()) {
                throw new IdInvalidException("AI không trả coverImagePrompt hợp lệ");
            }

            String mood = textOrBlank(root, "mood");
            String palette = textOrBlank(root, "palette");
            String composition = textOrBlank(root, "composition");

            StringBuilder finalPrompt = new StringBuilder();
            finalPrompt.append("Wide cinematic 16:9 story cover illustration. ");
            finalPrompt.append(coverImagePrompt.trim());
            if (!mood.isBlank()) {
                finalPrompt.append(" Mood: ").append(mood).append(".");
            }
            if (!palette.isBlank()) {
                finalPrompt.append(" Color palette: ").append(palette).append(".");
            }
            if (!composition.isBlank()) {
                finalPrompt.append(" Composition: ").append(composition).append(".");
            }
            finalPrompt.append(
                    " Rich depth, atmospheric lighting, educational storybook style."
                            + " NO text, NO letters, NO watermark, NO logo.");

            log.debug("[StoryCover] LLM cover prompt scene={} subjects={}",
                    textOrBlank(root, "scene"),
                    textOrBlank(root, "subjects"));

            return finalPrompt.toString();
        } catch (IdInvalidException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IdInvalidException("Không phân tích được prompt ảnh từ AI: " + ex.getMessage());
        }
    }

    private static String textOrBlank(JsonNode root, String field) {
        if (root == null || !root.has(field) || root.get(field).isNull()) {
            return "";
        }
        return root.get(field).asText("").trim();
    }

    private byte[] resolveImageBytes(OpenRouterClient.ImageGenResult gen) throws IdInvalidException {
        if (gen.getB64Json() != null && !gen.getB64Json().isBlank()) {
            try {
                return Base64.getDecoder().decode(gen.getB64Json().trim());
            } catch (IllegalArgumentException e) {
                throw new IdInvalidException("Ảnh base64 không hợp lệ");
            }
        }
        if (gen.getUrl() != null && !gen.getUrl().isBlank()) {
            return downloadBytes(gen.getUrl().trim());
        }
        throw new IdInvalidException("AI không trả dữ liệu ảnh");
    }

    private byte[] downloadBytes(String url) throws IdInvalidException {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(60))
                    .GET()
                    .build();
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() >= 400 || response.body() == null || response.body().length == 0) {
                throw new IdInvalidException("Không tải được ảnh từ AI");
            }
            return response.body();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IdInvalidException("Tải ảnh bị gián đoạn");
        } catch (IOException e) {
            throw new IdInvalidException("Không tải được ảnh từ AI: " + e.getMessage());
        }
    }
}
