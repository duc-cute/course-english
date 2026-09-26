package com.courseenglish.api.repository;

import com.courseenglish.api.domain.WordPronunciationCache;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WordPronunciationCacheRepository extends JpaRepository<WordPronunciationCache, UUID> {

    Optional<WordPronunciationCache> findByWordKeyAndVoidedFalse(String wordKey);

    List<WordPronunciationCache> findByWordKeyInAndVoidedFalse(Collection<String> wordKeys);
}
