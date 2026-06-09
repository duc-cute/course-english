package com.courseenglish.api.integration.dictionary.freedictionary;

import com.courseenglish.api.integration.common.ExternalApiException;
import com.courseenglish.api.integration.dictionary.freedictionary.dto.FreeDictionaryEntryDto;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.List;

/**
 * HTTP client for <a href="https://dictionaryapi.dev/">Free Dictionary API</a>.
 * Raw response shape: {@code List<FreeDictionaryEntryDto>} — see {@code data.md}.
 */
@Component
@ConditionalOnProperty(
        prefix = "integration.dictionary.free-dictionary",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class FreeDictionaryClient {

    public static final String PROVIDER_ID = "freedictionaryapi.dev";

    private final RestClient restClient;
    private final FreeDictionaryProperties properties;

    public FreeDictionaryClient(RestClient.Builder restClientBuilder, FreeDictionaryProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(properties.getConnectTimeoutMs());
        factory.setReadTimeout(properties.getReadTimeoutMs());
        this.restClient = restClientBuilder
                .baseUrl(trimTrailingSlash(properties.getBaseUrl()))
                .requestFactory(factory)
                .build();
    }

    /**
     * @return entries for the word, or empty list when API returns 404 / no data
     */
    public List<FreeDictionaryEntryDto> fetchEntries(String wordEn) {
        String word = wordEn == null ? "" : wordEn.trim();
        if (word.isEmpty()) {
            return Collections.emptyList();
        }

        try {
            List<FreeDictionaryEntryDto> body = restClient.get()
                    .uri("/api/v2/entries/en/{word}", word)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });
            if (body == null || body.isEmpty()) {
                return Collections.emptyList();
            }
            return body;
        } catch (HttpClientErrorException.NotFound e) {
            return Collections.emptyList();
        } catch (HttpClientErrorException e) {
            throw new ExternalApiException(
                    PROVIDER_ID,
                    "Dictionary API error " + e.getStatusCode().value() + " for word: " + word,
                    e);
        } catch (Exception e) {
            throw new ExternalApiException(
                    PROVIDER_ID,
                    "Failed to call dictionary API for word: " + word,
                    e);
        }
    }

    private static String trimTrailingSlash(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return "https://api.dictionaryapi.dev";
        }
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }
}
