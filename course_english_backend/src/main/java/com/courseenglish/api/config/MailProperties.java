package com.courseenglish.api.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {

    private boolean enabled = false;
    private String from = "Course English <noreply@courseenglish.local>";
    private String frontendBaseUrl = "http://localhost:5174";
    /** Base URL for /storage/** assets embedded in email (must be reachable by mail clients). */
    private String apiBaseUrl = "http://localhost:7070";

    public boolean isConfigured() {
        return enabled;
    }
}
