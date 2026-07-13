package com.courseenglish.api.repository;

import com.courseenglish.api.domain.VocabularyTopic;
import com.courseenglish.api.util.constant.VocabularyTopicStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VocabularyTopicRepository extends JpaRepository<VocabularyTopic, UUID> {

    Optional<VocabularyTopic> findByIdAndVoidedFalse(UUID id);

    List<VocabularyTopic> findByJourney_IdAndVoidedFalseOrderByDisplayOrderAscTitleAsc(UUID journeyId);

    @Query("""
            SELECT t FROM VocabularyTopic t
            WHERE t.voided = false
              AND t.journey.id = :journeyId
              AND t.status = :status
            ORDER BY t.displayOrder ASC, t.title ASC
            """)
    List<VocabularyTopic> findPublishedByJourneyId(
            @Param("journeyId") UUID journeyId,
            @Param("status") VocabularyTopicStatusEnum status);
}
