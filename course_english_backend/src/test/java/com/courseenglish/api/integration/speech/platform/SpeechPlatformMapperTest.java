package com.courseenglish.api.integration.speech.platform;

import com.courseenglish.api.integration.speech.model.SpeechGenerationRequest;
import com.courseenglish.api.integration.speech.model.SpeechSentenceRef;
import com.courseenglish.api.integration.speech.platform.dto.SpeechPlatformSpeechResultDto;
import com.courseenglish.api.integration.speech.platform.dto.SpeechPlatformWordTimelineDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class SpeechPlatformMapperTest {

    private final SpeechPlatformMapper mapper = new SpeechPlatformMapper();

    @Test
    void toRequestDto_mapsTokensAndSentences() {
        var request = SpeechGenerationRequest.builder()
                .text("Tom showed his passport.")
                .tokens(List.of("Tom", "showed", "his", "passport"))
                .sentences(List.of(SpeechSentenceRef.builder()
                        .sentenceIndex(0)
                        .startWordIndex(0)
                        .endWordIndex(3)
                        .build()))
                .ttsProvider("edge")
                .alignmentProvider("faster-whisper")
                .voice("en-US-AriaNeural")
                .build();

        var dto = mapper.toRequestDto(request);

        assertEquals("Tom showed his passport.", dto.getText());
        assertEquals(4, dto.getTokens().size());
        assertEquals(1, dto.getSentences().size());
        assertEquals("edge", dto.getProvider());
        assertEquals("faster-whisper", dto.getAlignmentProvider());
    }

    @Test
    void toDomain_mapsSpeechResult() {
        var word = new SpeechPlatformWordTimelineDto();
        word.setWordIndex(0);
        word.setWord("Tom");
        word.setStart(0.1);
        word.setEnd(0.3);

        var dto = new SpeechPlatformSpeechResultDto();
        dto.setProvider("edge");
        dto.setVoice("en-US-AriaNeural");
        dto.setDuration(1.5);
        dto.setAudioUrl("http://localhost:8100/files/tts/demo.mp3");
        dto.setTimeline(List.of(word));

        var result = mapper.toDomain(dto);

        assertNotNull(result);
        assertEquals("edge", result.getProvider());
        assertEquals(1, result.getTimeline().size());
        assertEquals(0, result.getTimeline().get(0).getWordIndex());
    }
}
