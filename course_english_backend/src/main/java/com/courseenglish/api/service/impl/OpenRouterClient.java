package com.courseenglish.api.service.impl;

import com.courseenglish.api.util.AiJsonResponseSanitizer;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class OpenRouterClient {

    private static final Logger log = LoggerFactory.getLogger(OpenRouterClient.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${app.ai.openrouter.base-url:https://openrouter.ai/api/v1}")
    private String baseUrl;

    @Value("${app.ai.openrouter.api-key:}")
    private String apiKey;

    @Value("${app.ai.openrouter.http-referer:http://localhost}")
    private String httpReferer;

    @Value("${app.ai.openrouter.x-title:Course English LMS}")
    private String xTitle;

    @Value("${app.ai.request-timeout-sec:120}")
    private long timeoutSeconds;

    @Value("${app.ai.log-requests:true}")
    private boolean logRequests;

    public OpenRouterClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public ChatResult chat(String model, List<Map<String, String>> messages) throws IdInvalidException {
        return chatSync(model, messages, false);
    }

    /**
     * Sync completion for structured JSON output (e.g. question generation).
     * Uses json_object response_format, lower temperature, and sanitizes markdown fences.
     */
    public ChatResult chatJson(String model, List<Map<String, String>> messages) throws IdInvalidException {
        return chatJson(model, messages, timeoutSeconds);
    }

    public ChatResult chatJson(String model, List<Map<String, String>> messages, long timeoutSec)
            throws IdInvalidException {
        return chatJson(model, messages, timeoutSec, null);
    }

    public ChatResult chatJson(
            String model, List<Map<String, String>> messages, long timeoutSec, Integer maxTokens)
            throws IdInvalidException {
        ChatResult result = chatSync(model, messages, true, timeoutSec, maxTokens);
        String raw = result.getContent();
        String clean = AiJsonResponseSanitizer.extractJsonObject(raw);
        if (clean.isBlank()) {
            throw new IdInvalidException("AI không trả JSON hợp lệ");
        }
        if (logRequests && !clean.equals(raw)) {
            log.info("[OpenRouter] Sanitized JSON response — rawLength={} cleanLength={}", raw.length(), clean.length());
            log.debug("[OpenRouter] rawContent={}", raw);
        }
        result.setRawContent(raw);
        result.setContent(clean);
        return result;
    }

    /**
     * Stream JSON completion; accumulates chunks, sanitizes to JSON object, returns final result.
     * {@link StreamHandler#onChunk} fires per delta; {@link StreamHandler#onComplete} receives sanitized result.
     */
    public ChatResult chatJsonStream(
            String model,
            List<Map<String, String>> messages,
            long timeoutSec,
            Integer maxTokens,
            StreamHandler handler) throws IdInvalidException {
        long startedNanos = System.nanoTime();
        HttpRequest request = buildChatRequest(model, messages, true, true, timeoutSec, maxTokens);
        HttpResponse<InputStream> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IdInvalidException("Kết nối AI bị gián đoạn");
        } catch (IOException e) {
            throw new IdInvalidException("Không gọi được OpenRouter");
        }

        if (response.statusCode() >= 400) {
            String errorBody = readErrorBody(response);
            if (logRequests) {
                log.error("[OpenRouter] HTTP {} — model={} — responseBody={}", response.statusCode(), model, errorBody);
            }
            throw new IdInvalidException("OpenRouter lỗi: HTTP " + response.statusCode());
        }

        StringBuilder fullContent = new StringBuilder();
        int promptTokens = 0;
        int completionTokens = 0;
        String responseModel = model;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.startsWith("data:")) {
                    continue;
                }
                String data = line.substring(5).trim();
                if (data.isEmpty() || "[DONE]".equals(data)) {
                    continue;
                }
                JsonNode root = objectMapper.readTree(data);
                if (root.hasNonNull("model")) {
                    responseModel = root.path("model").asText(model);
                }
                String delta = root.path("choices").path(0).path("delta").path("content").asText("");
                if (!delta.isEmpty()) {
                    fullContent.append(delta);
                    if (handler != null) {
                        handler.onChunk(delta);
                    }
                }
                if (root.has("usage") && !root.path("usage").isMissingNode()) {
                    promptTokens = root.path("usage").path("prompt_tokens").asInt(promptTokens);
                    completionTokens = root.path("usage").path("completion_tokens").asInt(completionTokens);
                }
            }
        } catch (IOException e) {
            throw new IdInvalidException("Không đọc được stream từ OpenRouter");
        }

        String raw = fullContent.toString().trim();
        String clean = AiJsonResponseSanitizer.extractJsonObject(raw);
        if (clean.isBlank()) {
            throw new IdInvalidException("AI không trả JSON hợp lệ");
        }

        long durationMs = (System.nanoTime() - startedNanos) / 1_000_000L;
        if (logRequests) {
            log.info(
                    "[OpenRouter] <<< stream completed in {}ms model={} promptTokens={} completionTokens={}",
                    durationMs,
                    responseModel,
                    promptTokens,
                    completionTokens);
            logOpenRouterResponse(responseModel, promptTokens, completionTokens, clean, "(stream)");
        }

        ChatResult result = new ChatResult();
        result.setRawContent(raw);
        result.setContent(clean);
        result.setPromptTokens(promptTokens);
        result.setCompletionTokens(completionTokens);
        result.setDurationMs((int) durationMs);
        if (handler != null) {
            try {
                handler.onComplete(result);
            } catch (IOException e) {
                throw new IdInvalidException("Không xử lý được stream completion");
            }
        }
        return result;
    }

    private static String readErrorBody(HttpResponse<InputStream> response) {
        try (InputStream errorStream = response.body()) {
            return new String(errorStream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "";
        }
    }

    private ChatResult chatSync(String model, List<Map<String, String>> messages, boolean jsonObjectMode)
            throws IdInvalidException {
        return chatSync(model, messages, jsonObjectMode, timeoutSeconds);
    }

    private ChatResult chatSync(
            String model, List<Map<String, String>> messages, boolean jsonObjectMode, long timeoutSec)
            throws IdInvalidException {
        return chatSync(model, messages, jsonObjectMode, timeoutSec, null);
    }

    private ChatResult chatSync(
            String model,
            List<Map<String, String>> messages,
            boolean jsonObjectMode,
            long timeoutSec,
            Integer maxTokens) throws IdInvalidException {
        HttpRequest request = buildChatRequest(model, messages, false, jsonObjectMode, timeoutSec, maxTokens);
        long startedNanos = System.nanoTime();
        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IdInvalidException("Kết nối AI bị gián đoạn");
        } catch (IOException e) {
            throw new IdInvalidException("Không gọi được OpenRouter");
        }

        String responseBody = response.body();
        if (response.statusCode() >= 400) {
            if (logRequests) {
                log.error(
                        "[OpenRouter] HTTP {} — model={} — responseBody={}",
                        response.statusCode(),
                        model,
                        responseBody);
            }
            throw new IdInvalidException("OpenRouter lỗi: HTTP " + response.statusCode());
        }

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String content = root.path("choices").path(0).path("message").path("content").asText("");
            int promptTokens = root.path("usage").path("prompt_tokens").asInt(0);
            int completionTokens = root.path("usage").path("completion_tokens").asInt(0);
            String responseModel = root.path("model").asText(model);

            if (content.isBlank()) {
                if (logRequests) {
                    log.warn("[OpenRouter] Empty content — model={} — rawResponse={}", model, responseBody);
                }
                throw new IdInvalidException("AI không trả nội dung hợp lệ");
            }

            if (logRequests) {
                long durationMs = (System.nanoTime() - startedNanos) / 1_000_000L;
                log.info(
                        "[OpenRouter] <<< completed in {}ms model={} promptTokens={} completionTokens={}",
                        durationMs,
                        responseModel,
                        promptTokens,
                        completionTokens);
                logOpenRouterResponse(responseModel, promptTokens, completionTokens, content, responseBody);
            }

            ChatResult result = new ChatResult();
            result.setContent(content.trim());
            result.setPromptTokens(promptTokens);
            result.setCompletionTokens(completionTokens);
            result.setDurationMs((int) ((System.nanoTime() - startedNanos) / 1_000_000L));
            return result;
        } catch (IOException e) {
            if (logRequests) {
                log.error("[OpenRouter] Parse error — model={} — rawResponse={}", model, responseBody, e);
            }
            throw new IdInvalidException("Không parse được response từ OpenRouter");
        }
    }

    public void chatStream(String model, List<Map<String, String>> messages, StreamHandler handler)
            throws IdInvalidException {
        HttpRequest request = buildChatRequest(model, messages, true, false, timeoutSeconds, null);
        HttpResponse<InputStream> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IdInvalidException("Kết nối AI bị gián đoạn");
        } catch (IOException e) {
            throw new IdInvalidException("Không gọi được OpenRouter");
        }

        if (response.statusCode() >= 400) {
            String errorBody = readErrorBody(response);
            if (logRequests) {
                log.error("[OpenRouter] HTTP {} — model={} — responseBody={}", response.statusCode(), model, errorBody);
            }
            throw new IdInvalidException("OpenRouter lỗi: HTTP " + response.statusCode());
        }

        StringBuilder fullContent = new StringBuilder();
        int promptTokens = 0;
        int completionTokens = 0;
        String responseModel = model;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.startsWith("data:")) {
                    continue;
                }
                String data = line.substring(5).trim();
                if (data.isEmpty() || "[DONE]".equals(data)) {
                    continue;
                }
                JsonNode root = objectMapper.readTree(data);
                if (root.hasNonNull("model")) {
                    responseModel = root.path("model").asText(model);
                }
                String delta = root.path("choices").path(0).path("delta").path("content").asText("");
                if (!delta.isEmpty()) {
                    fullContent.append(delta);
                    handler.onChunk(delta);
                }
                if (root.has("usage") && !root.path("usage").isMissingNode()) {
                    promptTokens = root.path("usage").path("prompt_tokens").asInt(promptTokens);
                    completionTokens = root.path("usage").path("completion_tokens").asInt(completionTokens);
                }
            }
        } catch (IOException e) {
            throw new IdInvalidException("Không đọc được stream từ OpenRouter");
        }

        String content = fullContent.toString().trim();
        if (content.isBlank()) {
            throw new IdInvalidException("AI không trả nội dung hợp lệ");
        }

        if (logRequests) {
            logOpenRouterResponse(responseModel, promptTokens, completionTokens, content, "(stream)");
        }

        ChatResult result = new ChatResult();
        result.setContent(content);
        result.setPromptTokens(promptTokens);
        result.setCompletionTokens(completionTokens);
        try {
            handler.onComplete(result);
        } catch (IOException e) {
            throw new IdInvalidException("Không gửi được chunk stream");
        }
    }

    private HttpRequest buildChatRequest(
            String model,
            List<Map<String, String>> messages,
            boolean stream,
            boolean jsonObjectMode,
            long timeoutSec,
            Integer maxTokens) throws IdInvalidException {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IdInvalidException("AI chưa được cấu hình OPENROUTER_API_KEY");
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        payload.put("messages", messages);
        payload.put("temperature", jsonObjectMode ? 0.2 : 0.4);
        payload.put("stream", stream);
        if (jsonObjectMode) {
            payload.put("response_format", Map.of("type", "json_object"));
        }
        if (maxTokens != null && maxTokens > 0) {
            payload.put("max_tokens", maxTokens);
        }
        if (stream) {
            payload.put("stream_options", Map.of("include_usage", true));
        }

        String requestBody;
        try {
            requestBody = objectMapper.writeValueAsString(payload);
        } catch (IOException e) {
            throw new IdInvalidException("Không thể tạo request AI");
        }

        if (logRequests) {
            logOpenRouterRequest(model, messages, requestBody);
        }

        return HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/chat/completions"))
                .timeout(Duration.ofSeconds(timeoutSec))
                .header("Authorization", "Bearer " + apiKey)
                .header("HTTP-Referer", httpReferer)
                .header("X-Title", xTitle)
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();
    }

    public interface StreamHandler {
        void onChunk(String delta) throws IOException;

        void onComplete(ChatResult result) throws IOException;
    }

    private void logOpenRouterRequest(String model, List<Map<String, String>> messages, String requestBody) {
        log.info("[OpenRouter] >>> REQUEST model={} messageCount={}", model, messages.size());
        for (int i = 0; i < messages.size(); i++) {
            Map<String, String> msg = messages.get(i);
            log.info(
                    "[OpenRouter] >>> message[{}] role={} content={}",
                    i,
                    msg.get("role"),
                    msg.get("content"));
        }
        log.debug("[OpenRouter] >>> requestBody={}", requestBody);
    }

    private void logOpenRouterResponse(
            String model,
            int promptTokens,
            int completionTokens,
            String content,
            String rawResponse) {
        log.info(
                "[OpenRouter] <<< RESPONSE model={} promptTokens={} completionTokens={}",
                model,
                promptTokens,
                completionTokens);
        log.info("[OpenRouter] <<< assistantContent={}", content);
        log.debug("[OpenRouter] <<< rawResponse={}", rawResponse);
    }

    public static class ChatResult {
        private String content;
        /** Original assistant text before JSON sanitization; set only for {@link #chatJson}. */
        private String rawContent;
        private Integer promptTokens;
        private Integer completionTokens;
        private Integer durationMs;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public String getRawContent() {
            return rawContent;
        }

        public void setRawContent(String rawContent) {
            this.rawContent = rawContent;
        }

        public Integer getPromptTokens() {
            return promptTokens;
        }

        public void setPromptTokens(Integer promptTokens) {
            this.promptTokens = promptTokens;
        }

        public Integer getCompletionTokens() {
            return completionTokens;
        }

        public void setCompletionTokens(Integer completionTokens) {
            this.completionTokens = completionTokens;
        }

        public Integer getDurationMs() {
            return durationMs;
        }

        public void setDurationMs(Integer durationMs) {
            this.durationMs = durationMs;
        }
    }
}
