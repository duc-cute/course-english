package com.courseenglish.api.integration.speech.platform;

import com.courseenglish.api.integration.common.ExternalApiException;
import com.courseenglish.api.integration.speech.platform.dto.SpeechPlatformSpeechResultDto;
import com.courseenglish.api.integration.speech.platform.dto.SpeechPlatformTtsRequestDto;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

@Component
@ConditionalOnProperty(
        prefix = "integration.speech.platform",
        name = "enabled",
        havingValue = "true"
)
public class SpeechPlatformClient {

    public static final String PROVIDER_ID = "ai-speech-platform";

    private final RestClient restClient;
    private final SpeechPlatformProperties properties;

    public SpeechPlatformClient(RestClient.Builder restClientBuilder, SpeechPlatformProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(properties.getConnectTimeoutMs());
        factory.setReadTimeout(properties.getReadTimeoutMs());
        this.restClient = restClientBuilder
                .baseUrl(trimTrailingSlash(properties.getBaseUrl()))
                .requestFactory(factory)
                .build();
    }

    public SpeechPlatformSpeechResultDto generateTts(SpeechPlatformTtsRequestDto request) {
        try {
            RestClient.RequestBodySpec spec = restClient.post()
                    .uri("/api/v1/tts/generate")
                    .contentType(MediaType.APPLICATION_JSON);

            if (properties.getApiKey() != null && !properties.getApiKey().isBlank()) {
                spec = spec.header("X-API-Key", properties.getApiKey().trim());
            }

            SpeechPlatformSpeechResultDto body = spec
                    .body(request)
                    .retrieve()
                    .body(SpeechPlatformSpeechResultDto.class);

            if (body == null || body.getAudioUrl() == null || body.getAudioUrl().isBlank()) {
                throw new ExternalApiException(PROVIDER_ID, "Speech platform returned empty audioUrl");
            }
            return body;
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            throw new ExternalApiException(
                    PROVIDER_ID,
                    "Speech platform HTTP " + e.getStatusCode().value() + ": " + e.getResponseBodyAsString(),
                    e);
        } catch (ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ExternalApiException(PROVIDER_ID, "Failed to call speech platform TTS API", e);
        }
    }

    public boolean healthCheck() {
        try {
            restClient.get()
                    .uri("/health")
                    .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private static String trimTrailingSlash(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return "http://localhost:8100";
        }
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }
}
