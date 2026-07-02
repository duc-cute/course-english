package com.courseenglish.api.integration.speech.port;

import com.courseenglish.api.integration.speech.model.SpeechGenerationRequest;
import com.courseenglish.api.integration.speech.model.SpeechResult;

/**
 * Abstraction for AI speech generation (TTS + alignment).
 * Business code must depend on this port — never on Edge, Whisper, or HTTP details.
 */
public interface SpeechGenerationPort {

    SpeechResult generate(SpeechGenerationRequest request);

    boolean isAvailable();
}
