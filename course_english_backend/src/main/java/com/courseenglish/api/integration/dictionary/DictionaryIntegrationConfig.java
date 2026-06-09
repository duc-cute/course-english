package com.courseenglish.api.integration.dictionary;

import com.courseenglish.api.integration.dictionary.freedictionary.FreeDictionaryProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(FreeDictionaryProperties.class)
public class DictionaryIntegrationConfig {
}
