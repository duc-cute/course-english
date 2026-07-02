package com.courseenglish.api.integration.speech.platform;

import com.courseenglish.api.integration.speech.model.SpeechGenerationRequest;
import com.courseenglish.api.integration.speech.model.SpeechResult;
import com.courseenglish.api.integration.speech.port.SpeechGenerationPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        prefix = "integration.speech.platform",
        name = "enabled",
        havingValue = "true"
)
public class SpeechPlatformAdapter implements SpeechGenerationPort {

    private final SpeechPlatformClient client;
    private final SpeechPlatformMapper mapper;

    public SpeechPlatformAdapter(SpeechPlatformClient client, SpeechPlatformMapper mapper) {
        this.client = client;
        this.mapper = mapper;
    }

    @Override
    public SpeechResult generate(SpeechGenerationRequest request) {
        return mapper.toDomain(client.generateTts(mapper.toRequestDto(request)));
    }

    @Override
    public boolean isAvailable() {
        return client.healthCheck();
    }
}
