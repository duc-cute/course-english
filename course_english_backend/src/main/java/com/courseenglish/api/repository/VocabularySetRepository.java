package com.courseenglish.api.repository;

import com.courseenglish.api.domain.VocabularySet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VocabularySetRepository extends JpaRepository<VocabularySet, UUID>, JpaSpecificationExecutor<VocabularySet> {
    Optional<VocabularySet> findByIdAndVoidedFalse(UUID id);
}
