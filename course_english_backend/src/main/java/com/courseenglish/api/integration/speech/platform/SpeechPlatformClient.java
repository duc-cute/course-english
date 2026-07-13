package com.courseenglish.api.integration.speech.platform;

import com.courseenglish.api.integration.common.ExternalApiException;
import com.courseenglish.api.integration.speech.platform.dto.SpeechPlatformElevenLabsVoiceListDto;
import com.courseenglish.api.integration.speech.platform.dto.SpeechPlatformSpeechResultDto;
import com.courseenglish.api.integration.speech.platform.dto.SpeechPlatformTtsRequestDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@ConditionalOnProperty(
        prefix = "integration.speech.platform",
        name = "enabled",
        havingValue = "true"
)
public class SpeechPlatformClient {

    private static final Logger log = LoggerFactory.getLogger(SpeechPlatformClient.class);

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
        String provider = request.getProvider() != null ? request.getProvider() : "?";
        String voice = request.getVoice() != null ? request.getVoice() : "?";
        int textLen = request.getText() != null ? request.getText().length() : 0;
        long started = System.currentTimeMillis();
        log.info(
                "[StoryAudio] HTTP POST /api/v1/tts/generate provider={} voice={} textLen={} baseUrl={}",
                provider,
                voice,
                textLen,
                properties.getBaseUrl());
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
                log.error("[StoryAudio] HTTP response missing audioUrl provider={} voice={}", provider, voice);
                throw new ExternalApiException(PROVIDER_ID, "Speech platform returned empty audioUrl");
            }
            log.info(
                    "[StoryAudio] HTTP OK provider={} voice={} duration={} audioUrl={} elapsedMs={}",
                    provider,
                    voice,
                    body.getDuration(),
                    body.getAudioUrl(),
                    System.currentTimeMillis() - started);
            return body;
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error(
                    "[StoryAudio] HTTP {} provider={} voice={} body={} elapsedMs={}",
                    e.getStatusCode().value(),
                    provider,
                    voice,
                    e.getResponseBodyAsString(),
                    System.currentTimeMillis() - started);
            throw new ExternalApiException(
                    PROVIDER_ID,
                    "Speech platform HTTP " + e.getStatusCode().value() + ": " + e.getResponseBodyAsString(),
                    e);
        } catch (ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            log.error(
                    "[StoryAudio] HTTP call failed provider={} voice={} reason={} elapsedMs={}",
                    provider,
                    voice,
                    e.getMessage(),
                    System.currentTimeMillis() - started,
                    e);
            throw new ExternalApiException(PROVIDER_ID, "Failed to call speech platform TTS API", e);
        }
    }

    public SpeechPlatformElevenLabsVoiceListDto listElevenLabsVoices(boolean freeOnly, String search) {
        long started = System.currentTimeMillis();
        String uri = UriComponentsBuilder.fromPath("/api/v1/tts/voices/elevenlabs")
                .queryParam("free_only", freeOnly)
                .queryParamIfPresent("search", java.util.Optional.ofNullable(search).filter(s -> !s.isBlank()))
                .build()
                .toUriString();
        log.info("[StoryAudio] HTTP GET {} baseUrl={}", uri, properties.getBaseUrl());
        try {
            RestClient.RequestHeadersSpec<?> spec = restClient.get()
                    .uri(uri)
                    .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
            if (properties.getApiKey() != null && !properties.getApiKey().isBlank()) {
                spec = spec.header("X-API-Key", properties.getApiKey().trim());
            }
            SpeechPlatformElevenLabsVoiceListDto body = spec
                    .retrieve()
                    .body(SpeechPlatformElevenLabsVoiceListDto.class);
            int count = body != null && body.getVoices() != null ? body.getVoices().size() : 0;
            log.info("[StoryAudio] HTTP OK elevenlabs voices count={} elapsedMs={}", count, System.currentTimeMillis() - started);
            return body != null ? body : new SpeechPlatformElevenLabsVoiceListDto();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error(
                    "[StoryAudio] HTTP {} elevenlabs voices body={} elapsedMs={}",
                    e.getStatusCode().value(),
                    e.getResponseBodyAsString(),
                    System.currentTimeMillis() - started);
            throw new ExternalApiException(
                    PROVIDER_ID,
                    "Speech platform HTTP " + e.getStatusCode().value() + ": " + e.getResponseBodyAsString(),
                    e);
        } catch (ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("[StoryAudio] HTTP elevenlabs voices failed reason={} elapsedMs={}", e.getMessage(), System.currentTimeMillis() - started, e);
            throw new ExternalApiException(PROVIDER_ID, "Failed to list ElevenLabs voices", e);
        }
    }

    public boolean healthCheck() {
        try {
            restClient.get()
                    .uri("/health")
                    .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                    .retrieve()
                    .toBodilessEntity();
            log.debug("[StoryAudio] Health check OK baseUrl={}", properties.getBaseUrl());
            return true;
        } catch (Exception e) {
            log.warn("[StoryAudio] Health check FAILED baseUrl={} reason={}", properties.getBaseUrl(), e.getMessage());
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
