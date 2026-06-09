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
        havingValue = "true",
        matchIfMissing = true
)
public class FreeDictionaryLookupAdapter implements DictionaryLookupPort {

    private final FreeDictionaryClient client;
    private final FreeDictionaryMapper mapper;

    public FreeDictionaryLookupAdapter(FreeDictionaryClient client, FreeDictionaryMapper mapper) {
        this.client = client;
        this.mapper = mapper;
    }

    @Override
    public Optional<VocabularyEnrichmentData> lookup(String wordEn) {
        return mapper.mapFirstEntry(client.fetchEntries(wordEn));
    }
}
