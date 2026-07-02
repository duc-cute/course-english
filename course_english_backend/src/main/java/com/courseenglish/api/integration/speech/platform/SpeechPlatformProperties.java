package com.courseenglish.api.integration.speech.platform;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "integration.speech.platform")
public class SpeechPlatformProperties {

    /** Master switch — when false, NoOp adapter is used. */
    private boolean enabled = false;

    private String baseUrl = "http://localhost:8100";

    private String apiKey = "";

    private int connectTimeoutMs = 5_000;

    /** TTS + alignment can be slow (Whisper). */
    private int readTimeoutMs = 300_000;

    private String defaultTtsProvider = "edge";

    private String defaultAlignmentProvider = "faster-whisper";

    private String defaultVoice = "en-US-AriaNeural";

    private double defaultSpeed = 1.0;

    private String defaultFormat = "mp3";
}
