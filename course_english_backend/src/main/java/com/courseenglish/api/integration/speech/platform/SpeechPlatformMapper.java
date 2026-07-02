package com.courseenglish.api.integration.speech.platform;

import com.courseenglish.api.integration.speech.model.SentenceTimelineData;
import com.courseenglish.api.integration.speech.model.SpeechGenerationRequest;
import com.courseenglish.api.integration.speech.model.SpeechResult;
import com.courseenglish.api.integration.speech.model.SpeechSentenceRef;
import com.courseenglish.api.integration.speech.model.WordTimelineData;
import com.courseenglish.api.integration.speech.platform.dto.SpeechPlatformSentenceRefDto;
import com.courseenglish.api.integration.speech.platform.dto.SpeechPlatformSentenceTimelineDto;
import com.courseenglish.api.integration.speech.platform.dto.SpeechPlatformSpeechResultDto;
import com.courseenglish.api.integration.speech.platform.dto.SpeechPlatformTtsRequestDto;
import com.courseenglish.api.integration.speech.platform.dto.SpeechPlatformWordTimelineDto;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class SpeechPlatformMapper {

    public SpeechPlatformTtsRequestDto toRequestDto(SpeechGenerationRequest request) {
        SpeechPlatformTtsRequestDto dto = new SpeechPlatformTtsRequestDto();
        dto.setText(request.getText());
        dto.setTokens(request.getTokens() != null ? request.getTokens() : Collections.emptyList());
        dto.setSentences(mapSentenceRefs(request.getSentences()));
        dto.setProvider(request.getTtsProvider());
        dto.setAlignmentProvider(request.getAlignmentProvider());
        dto.setVoice(request.getVoice());
        dto.setSpeed(request.getSpeed());
        dto.setPitch(request.getPitch());
        dto.setFormat(request.getFormat());
        return dto;
    }

    public SpeechResult toDomain(SpeechPlatformSpeechResultDto dto) {
        return SpeechResult.builder()
                .provider(dto.getProvider())
                .voice(dto.getVoice())
                .duration(dto.getDuration())
                .audioUrl(dto.getAudioUrl())
                .timeline(mapWordTimeline(dto.getTimeline()))
                .sentenceTimeline(mapSentenceTimeline(dto.getSentenceTimeline()))
                .build();
    }

    private List<SpeechPlatformSentenceRefDto> mapSentenceRefs(List<SpeechSentenceRef> refs) {
        if (refs == null || refs.isEmpty()) {
            return Collections.emptyList();
        }
        return refs.stream().map(ref -> {
            SpeechPlatformSentenceRefDto dto = new SpeechPlatformSentenceRefDto();
            dto.setSentenceIndex(ref.getSentenceIndex());
            dto.setStartWordIndex(ref.getStartWordIndex());
            dto.setEndWordIndex(ref.getEndWordIndex());
            return dto;
        }).collect(Collectors.toList());
    }

    private List<WordTimelineData> mapWordTimeline(List<SpeechPlatformWordTimelineDto> items) {
        if (items == null) {
            return Collections.emptyList();
        }
        return items.stream()
                .map(item -> WordTimelineData.builder()
                        .wordIndex(item.getWordIndex())
                        .word(item.getWord())
                        .start(item.getStart())
                        .end(item.getEnd())
                        .charStart(item.getCharStart())
                        .charEnd(item.getCharEnd())
                        .build())
                .collect(Collectors.toList());
    }

    private List<SentenceTimelineData> mapSentenceTimeline(List<SpeechPlatformSentenceTimelineDto> items) {
        if (items == null) {
            return Collections.emptyList();
        }
        return items.stream()
                .map(item -> SentenceTimelineData.builder()
                        .sentenceIndex(item.getSentenceIndex())
                        .start(item.getStart())
                        .end(item.getEnd())
                        .build())
                .collect(Collectors.toList());
    }
}
