package com.courseenglish.api.integration.speech.service;

import com.courseenglish.api.integration.speech.model.SpeechGenerationRequest;
import com.courseenglish.api.integration.speech.model.SpeechResult;
import com.courseenglish.api.integration.speech.platform.SpeechPlatformProperties;
import com.courseenglish.api.integration.speech.port.SpeechGenerationPort;
import org.springframework.stereotype.Service;

/**
 * Application facade for speech generation — story audio, vocab TTS, etc.
 */
@Service
public class SpeechGenerationService {

    private final SpeechGenerationPort speechGenerationPort;
    private final SpeechPlatformProperties properties;

    public SpeechGenerationService(
            SpeechGenerationPort speechGenerationPort,
            SpeechPlatformProperties properties) {
        this.speechGenerationPort = speechGenerationPort;
        this.properties = properties;
    }

    public boolean isEnabled() {
        return properties.isEnabled();
    }

    public boolean isAvailable() {
        return properties.isEnabled() && speechGenerationPort.isAvailable();
    }

    public SpeechResult generate(SpeechGenerationRequest request) {
        SpeechGenerationRequest normalized = normalize(request);
        return speechGenerationPort.generate(normalized);
    }

    private SpeechGenerationRequest normalize(SpeechGenerationRequest request) {
        return SpeechGenerationRequest.builder()
                .text(request.getText())
                .tokens(request.getTokens())
                .sentences(request.getSentences())
                .ttsProvider(firstNonBlank(request.getTtsProvider(), properties.getDefaultTtsProvider()))
                .alignmentProvider(firstNonBlank(
                        request.getAlignmentProvider(), properties.getDefaultAlignmentProvider()))
                .voice(firstNonBlank(request.getVoice(), properties.getDefaultVoice()))
                .speed(request.getSpeed() > 0 ? request.getSpeed() : properties.getDefaultSpeed())
                .pitch(request.getPitch())
                .format(firstNonBlank(request.getFormat(), properties.getDefaultFormat()))
                .build();
    }

    private static String firstNonBlank(String value, String fallback) {
        return value != null && !value.isBlank() ? value.trim() : fallback;
    }
}
