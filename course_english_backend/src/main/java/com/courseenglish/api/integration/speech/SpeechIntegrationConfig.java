package com.courseenglish.api.integration.speech;

import com.courseenglish.api.integration.speech.platform.SpeechPlatformProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(SpeechPlatformProperties.class)
public class SpeechIntegrationConfig {
}
