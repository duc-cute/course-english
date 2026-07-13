package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.response.ResElevenLabsVoiceDTO;
import com.courseenglish.api.domain.response.ResElevenLabsVoiceListDTO;
import com.courseenglish.api.integration.speech.platform.SpeechPlatformClient;
import com.courseenglish.api.integration.speech.platform.dto.SpeechPlatformElevenLabsVoiceDto;
import com.courseenglish.api.integration.speech.platform.dto.SpeechPlatformElevenLabsVoiceListDto;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ElevenLabsVoiceDiscoveryService {

    private final ObjectProvider<SpeechPlatformClient> speechPlatformClient;

    public ElevenLabsVoiceDiscoveryService(ObjectProvider<SpeechPlatformClient> speechPlatformClient) {
        this.speechPlatformClient = speechPlatformClient;
    }

    public ResElevenLabsVoiceListDTO listVoices(boolean freeOnly, String search) {
        SpeechPlatformClient client = speechPlatformClient.getIfAvailable();
        if (client == null) {
            throw new IllegalStateException(
                    "Speech platform chưa bật — set integration.speech.platform.enabled=true và chạy reading_text");
        }
        SpeechPlatformElevenLabsVoiceListDto raw = client.listElevenLabsVoices(freeOnly, search);
        return toResponse(raw);
    }

    private static ResElevenLabsVoiceListDTO toResponse(SpeechPlatformElevenLabsVoiceListDto raw) {
        ResElevenLabsVoiceListDTO dto = new ResElevenLabsVoiceListDTO();
        if (raw == null) {
            return dto;
        }
        dto.setProvider(raw.getProvider() != null ? raw.getProvider() : "elevenlabs");
        dto.setSource(raw.getSource() != null ? raw.getSource() : "v2");
        dto.setTotalCount(raw.getTotalCount() != null ? raw.getTotalCount() : 0);
        dto.setFreeApiHintCount(raw.getFreeApiHintCount() != null ? raw.getFreeApiHintCount() : 0);
        List<SpeechPlatformElevenLabsVoiceDto> voices = raw.getVoices();
        if (voices == null) {
            return dto;
        }
        for (SpeechPlatformElevenLabsVoiceDto voice : voices) {
            ResElevenLabsVoiceDTO item = new ResElevenLabsVoiceDTO();
            item.setVoiceId(voice.getVoiceId());
            item.setName(voice.getName());
            item.setCategory(voice.getCategory());
            item.setGender(voice.getGender());
            item.setAccent(voice.getAccent());
            item.setAge(voice.getAge());
            item.setDescription(voice.getDescription());
            item.setPreviewUrl(voice.getPreviewUrl());
            item.setFreeApiHint(Boolean.TRUE.equals(voice.getFreeApiHint()));
            if (voice.getAvailableForTiers() != null) {
                item.setAvailableForTiers(voice.getAvailableForTiers());
            }
            dto.getVoices().add(item);
        }
        return dto;
    }
}
