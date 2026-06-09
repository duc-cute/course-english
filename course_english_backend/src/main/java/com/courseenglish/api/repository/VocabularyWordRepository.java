package com.courseenglish.api.repository;

import com.courseenglish.api.domain.VocabularyWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VocabularyWordRepository extends JpaRepository<VocabularyWord, UUID>, JpaSpecificationExecutor<VocabularyWord> {

    Optional<VocabularyWord> findByWordKeyAndVoidedFalse(String wordKey);

    Optional<VocabularyWord> findByIdAndVoidedFalse(UUID id);

    List<VocabularyWord> findByWordKeyInAndVoidedFalse(Collection<String> wordKeys);

    boolean existsByWordKeyAndVoidedFalse(String wordKey);
}
