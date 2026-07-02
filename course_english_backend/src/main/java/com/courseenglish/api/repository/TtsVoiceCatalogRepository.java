package com.courseenglish.api.repository;

import com.courseenglish.api.domain.TtsVoiceCatalog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TtsVoiceCatalogRepository extends JpaRepository<TtsVoiceCatalog, UUID> {
    List<TtsVoiceCatalog> findByVoidedFalseAndActiveTrueOrderByProfileKeyAscPriorityAscDisplayNameAsc();

    Optional<TtsVoiceCatalog> findFirstByProviderAndVoiceIdAndVoidedFalseAndActiveTrue(String provider, String voiceId);

    List<TtsVoiceCatalog> findByVoiceIdAndVoidedFalseAndActiveTrueOrderByPriorityAsc(String voiceId);

    Optional<TtsVoiceCatalog> findFirstByProfileKeyAndProviderAndVoidedFalseAndActiveTrueOrderByPriorityAsc(
            String profileKey, String provider);
}
