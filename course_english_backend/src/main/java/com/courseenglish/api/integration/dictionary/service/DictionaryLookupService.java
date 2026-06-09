package com.courseenglish.api.integration.dictionary.service;

import com.courseenglish.api.integration.dictionary.model.VocabularyEnrichmentData;
import com.courseenglish.api.integration.dictionary.port.DictionaryLookupPort;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Application facade for dictionary enrichment — used by vocabulary services (Phase 3).
 */
@Service
public class DictionaryLookupService {

    private final DictionaryLookupPort dictionaryLookupPort;

    public DictionaryLookupService(DictionaryLookupPort dictionaryLookupPort) {
        this.dictionaryLookupPort = dictionaryLookupPort;
    }

    public Optional<VocabularyEnrichmentData> lookup(String wordEn) {
        if (wordEn == null || wordEn.isBlank()) {
            return Optional.empty();
        }
        return dictionaryLookupPort.lookup(wordEn.trim());
    }
}
