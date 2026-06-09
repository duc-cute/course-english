package com.courseenglish.api.integration.dictionary.port;

import com.courseenglish.api.integration.dictionary.model.VocabularyEnrichmentData;

import java.util.Optional;

/**
 * Abstraction for dictionary / pronunciation providers.
 * Implementations live under {@code integration.dictionary.<provider>}.
 */
public interface DictionaryLookupPort {

    Optional<VocabularyEnrichmentData> lookup(String wordEn);
}
