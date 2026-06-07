package com.courseenglish.api.repository;

import com.courseenglish.api.domain.VocabularyItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VocabularyItemRepository extends JpaRepository<VocabularyItem, UUID> {
    List<VocabularyItem> findByVocabularySet_IdAndVoidedFalseOrderByDisplayOrderAsc(UUID setId);

    List<VocabularyItem> findByVocabularySet_Id(UUID setId);

    long countByVocabularySet_IdAndVoidedFalse(UUID setId);
}
