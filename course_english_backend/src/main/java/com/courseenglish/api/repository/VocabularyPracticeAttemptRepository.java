package com.courseenglish.api.repository;

import com.courseenglish.api.domain.VocabularyPracticeAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VocabularyPracticeAttemptRepository extends JpaRepository<VocabularyPracticeAttempt, UUID> {

    Optional<VocabularyPracticeAttempt> findFirstByUserIdAndVocabularySetIdAndVoidedFalseOrderByCompletedAtDesc(
            UUID userId, UUID vocabularySetId);

    Optional<VocabularyPracticeAttempt> findFirstByUserIdAndVocabularySetIdAndVoidedFalseOrderByScorePercentDescCorrectCountDescCompletedAtDesc(
            UUID userId, UUID vocabularySetId);

    List<VocabularyPracticeAttempt> findByUserIdAndVocabularySetIdAndVoidedFalseOrderByCompletedAtDesc(
            UUID userId, UUID vocabularySetId);

    List<VocabularyPracticeAttempt> findByUserIdAndVocabularySetIdInAndVoidedFalse(
            UUID userId, List<UUID> vocabularySetIds);
}
