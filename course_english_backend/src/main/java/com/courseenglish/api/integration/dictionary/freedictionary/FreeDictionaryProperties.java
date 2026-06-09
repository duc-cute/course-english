package com.courseenglish.api.integration.dictionary.freedictionary;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "integration.dictionary.free-dictionary")
public class FreeDictionaryProperties {

    /** Enable this provider (default true). */
    private boolean enabled = true;

    private String baseUrl = "https://api.dictionaryapi.dev";

    private int connectTimeoutMs = 3000;

    private int readTimeoutMs = 8000;
}
