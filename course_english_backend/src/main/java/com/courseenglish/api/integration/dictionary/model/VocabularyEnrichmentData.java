package com.courseenglish.api.integration.dictionary.model;

import lombok.Builder;
import lombok.Getter;

/**
 * Normalized enrichment payload — independent of any single dictionary provider.
 */
@Getter
@Builder
public class VocabularyEnrichmentData {

    private final String wordEn;
    private final String phonetic;
    private final String audioUkUrl;
    private final String audioUsUrl;
    private final String partOfSpeech;
    private final String enrichSource;
}
