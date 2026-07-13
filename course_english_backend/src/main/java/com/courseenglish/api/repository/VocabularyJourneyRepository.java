package com.courseenglish.api.repository;

import com.courseenglish.api.domain.VocabularyJourney;
import com.courseenglish.api.util.constant.VocabularyJourneyStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VocabularyJourneyRepository
        extends JpaRepository<VocabularyJourney, UUID>, JpaSpecificationExecutor<VocabularyJourney> {

    Optional<VocabularyJourney> findByIdAndVoidedFalse(UUID id);

    Optional<VocabularyJourney> findByIdAndStatusAndVoidedFalse(
            UUID id, VocabularyJourneyStatusEnum status);
}
