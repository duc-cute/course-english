package com.courseenglish.api.integration.common;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * Shared HTTP client factory for external integrations (dictionary, TTS, AI, …).
 */
@Configuration
public class IntegrationRestClientConfig {

    @Bean
    RestClient.Builder integrationRestClientBuilder(RestTemplateBuilder restTemplateBuilder) {
        return RestClient.builder()
                .requestFactory(restTemplateBuilder
                        .setConnectTimeout(Duration.ofSeconds(3))
                        .setReadTimeout(Duration.ofSeconds(8))
                        .buildRequestFactory());
    }
}
