package com.courseenglish.api.service.ai.vocabulary;

import com.courseenglish.api.service.FileService;
import com.courseenglish.api.service.impl.OpenRouterClient;
import com.courseenglish.api.util.AppConstants;
import com.courseenglish.api.util.error.IdInvalidException;
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
import java.util.UUID;

@Service
public class VocabularySetCoverImageService {
    private static final Logger log = LoggerFactory.getLogger(VocabularySetCoverImageService.class);

    public static final String STORAGE_FOLDER = "vocabulary-sets/covers";

    private final OpenRouterClient openRouterClient;
    private final FileService fileService;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();

    public VocabularySetCoverImageService(OpenRouterClient openRouterClient, FileService fileService) {
        this.openRouterClient = openRouterClient;
        this.fileService = fileService;
    }

    /**
     * Generates cover via image-gen, stores under storage, returns public path /storage/...
     */
    public String generateAndStoreCover(String coverImagePrompt, UUID taskId) throws IdInvalidException {
        if (coverImagePrompt == null || coverImagePrompt.isBlank()) {
            return null;
        }

        log.debug(
                "[VocabCover] start taskId={} model={} timeoutSec={} promptLength={} promptPreview={}",
                taskId,
                AppConstants.aiVocabSetCoverImageModel,
                AppConstants.aiVocabSetCoverImageTimeoutSec,
                coverImagePrompt.length(),
                previewPrompt(coverImagePrompt));

        OpenRouterClient.ImageGenResult gen =
            openRouterClient.generateImage(
                AppConstants.aiVocabSetCoverImageModel,
                coverImagePrompt,
                AppConstants.aiVocabSetCoverImageTimeoutSec);

        log.info(
                "[VocabCover] image response taskId={} hasUrl={} hasB64={}",
                taskId,
                gen.getUrl() != null && !gen.getUrl().isBlank(),
                gen.getB64Json() != null && !gen.getB64Json().isBlank());

        byte[] imageBytes = resolveImageBytes(gen);
        String fileName = (taskId != null ? taskId : UUID.randomUUID()) + ".png";
        try {
            fileService.storeBytes(imageBytes, STORAGE_FOLDER, fileName);
        } catch (IOException e) {
            throw new IdInvalidException("Không lưu được ảnh cover: " + e.getMessage());
        }
        log.info("[VocabCover] stored taskId={} sizeBytes={} file={}", taskId, imageBytes.length, fileName);
        return "/storage/" + STORAGE_FOLDER + "/" + fileName;
    }

    private byte[] resolveImageBytes(OpenRouterClient.ImageGenResult gen) throws IdInvalidException {
        if (gen.getB64Json() != null && !gen.getB64Json().isBlank()) {
            try {
                log.debug("[VocabCover] decode from base64");
                return Base64.getDecoder().decode(gen.getB64Json().trim());
            } catch (IllegalArgumentException e) {
                throw new IdInvalidException("Ảnh base64 không hợp lệ");
            }
        }
        if (gen.getUrl() != null && !gen.getUrl().isBlank()) {
            log.debug("[VocabCover] download from url={}", gen.getUrl());
            return downloadBytes(gen.getUrl().trim());
        }
        throw new IdInvalidException("AI không trả dữ liệu ảnh");
    }

    private byte[] downloadBytes(String url) throws IdInvalidException {
        try {
            HttpRequest request =
                    HttpRequest.newBuilder()
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

    private String previewPrompt(String prompt) {
        String normalized = prompt.replace('\n', ' ').replace('\r', ' ').trim();
        if (normalized.length() <= 160) {
            return normalized;
        }
        return normalized.substring(0, 160) + "...";
    }
}
