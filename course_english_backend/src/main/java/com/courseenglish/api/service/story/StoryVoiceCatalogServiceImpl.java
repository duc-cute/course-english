package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.TtsVoiceCatalog;
import com.courseenglish.api.domain.response.ResTtsVoiceCatalogDTO;
import com.courseenglish.api.repository.TtsVoiceCatalogRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class StoryVoiceCatalogServiceImpl implements StoryVoiceCatalogService {

    private final TtsVoiceCatalogRepository ttsVoiceCatalogRepository;

    public StoryVoiceCatalogServiceImpl(TtsVoiceCatalogRepository ttsVoiceCatalogRepository) {
        this.ttsVoiceCatalogRepository = ttsVoiceCatalogRepository;
    }

    @Override
    public List<ResTtsVoiceCatalogDTO> listActiveVoices(String profileKey) {
        String normalized = profileKey == null ? "" : profileKey.trim().toUpperCase(Locale.ROOT);
        // Story casting: Edge TTS only (no ElevenLabs).
        return ttsVoiceCatalogRepository.findByVoidedFalseAndActiveTrueOrderByProfileKeyAscPriorityAscDisplayNameAsc()
                .stream()
                .filter(v -> "edge".equalsIgnoreCase(v.getProvider()))
                .filter(v -> normalized.isBlank()
                        || normalized.equalsIgnoreCase(v.getProfileKey())
                        || "ANY".equals(normalized))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private ResTtsVoiceCatalogDTO toDto(TtsVoiceCatalog entity) {
        ResTtsVoiceCatalogDTO dto = new ResTtsVoiceCatalogDTO();
        dto.setId(entity.getId());
        dto.setProvider(entity.getProvider());
        dto.setVoiceId(entity.getVoiceId());
        dto.setDisplayName(entity.getDisplayName());
        dto.setProfileKey(entity.getProfileKey());
        dto.setGender(entity.getGender());
        dto.setAgeGroup(entity.getAgeGroup());
        dto.setPriority(entity.getPriority());
        return dto;
    }
}
