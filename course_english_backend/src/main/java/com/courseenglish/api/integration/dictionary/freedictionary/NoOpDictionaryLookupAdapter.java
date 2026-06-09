package com.courseenglish.api.integration.dictionary.freedictionary;

import com.courseenglish.api.integration.dictionary.model.VocabularyEnrichmentData;
import com.courseenglish.api.integration.dictionary.port.DictionaryLookupPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@ConditionalOnProperty(
        prefix = "integration.dictionary.free-dictionary",
        name = "enabled",
        havingValue = "false"
)
public class NoOpDictionaryLookupAdapter implements DictionaryLookupPort {

    @Override
    public Optional<VocabularyEnrichmentData> lookup(String wordEn) {
        return Optional.empty();
    }
}
