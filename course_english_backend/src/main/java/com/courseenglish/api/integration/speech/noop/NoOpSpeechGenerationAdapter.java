package com.courseenglish.api.integration.speech.noop;

import com.courseenglish.api.integration.speech.model.SpeechGenerationRequest;
import com.courseenglish.api.integration.speech.model.SpeechResult;
import com.courseenglish.api.integration.speech.port.SpeechGenerationPort;
import com.courseenglish.api.integration.speech.SpeechNotAvailableException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        prefix = "integration.speech.platform",
        name = "enabled",
        havingValue = "false",
        matchIfMissing = true
)
public class NoOpSpeechGenerationAdapter implements SpeechGenerationPort {

    @Override
    public SpeechResult generate(SpeechGenerationRequest request) {
        throw new SpeechNotAvailableException(
                "Speech platform integration is disabled. Set integration.speech.platform.enabled=true");
    }

    @Override
    public boolean isAvailable() {
        return false;
    }
}
