package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.VocabularyWord;
import com.courseenglish.api.domain.dto.story.StoryGlossaryEntryDTO;
import com.courseenglish.api.domain.dto.story.StorySentenceDTO;
import com.courseenglish.api.domain.dto.story.StoryTokenDTO;
import com.courseenglish.api.domain.dto.story.StoryTranslationsPayloadDTO;
import com.courseenglish.api.integration.dictionary.model.VocabularyEnrichmentData;
import com.courseenglish.api.integration.dictionary.service.DictionaryLookupService;
import com.courseenglish.api.repository.VocabularyWordRepository;
import com.courseenglish.api.util.StoryWordKeyUtil;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class StoryTranslationMergeService {

    private final VocabularyWordRepository vocabularyWordRepository;
    private final DictionaryLookupService dictionaryLookupService;

    public StoryTranslationMergeService(
            VocabularyWordRepository vocabularyWordRepository,
            DictionaryLookupService dictionaryLookupService) {
        this.vocabularyWordRepository = vocabularyWordRepository;
        this.dictionaryLookupService = dictionaryLookupService;
    }

    public StoryTranslationsPayloadDTO parseFromAi(JsonNode root) {
        StoryTranslationsPayloadDTO payload = new StoryTranslationsPayloadDTO();
        if (root == null) {
            return payload;
        }

        JsonNode sentenceNode = root.path("sentenceTranslations");
        if (sentenceNode.isArray()) {
            for (JsonNode item : sentenceNode) {
                if (item.isTextual()) {
                    String vi = item.asText("").trim();
                    if (!vi.isBlank()) {
                        payload.getSentenceTranslations().add(vi);
                    }
                }
            }
        }

        JsonNode glossaryNode = root.path("glossary");
        if (glossaryNode.isArray()) {
            Map<String, StoryGlossaryEntryDTO> deduped = new LinkedHashMap<>();
            for (JsonNode item : glossaryNode) {
                String wordEn = textOrBlank(item, "word");
                if (wordEn.isBlank()) {
                    wordEn = textOrBlank(item, "wordEn");
                }
                String meaningVi = textOrBlank(item, "meaningVi");
                if (wordEn.isBlank() || meaningVi.isBlank()) {
                    continue;
                }
                String wordKey = StoryWordKeyUtil.toWordKey(wordEn);
                if (wordKey.isBlank()) {
                    continue;
                }
                StoryGlossaryEntryDTO entry = new StoryGlossaryEntryDTO();
                entry.setWordKey(wordKey);
                entry.setWordEn(wordEn.trim());
                entry.setMeaningVi(meaningVi.trim());
                entry.setPartOfSpeech(blankToNull(textOrBlank(item, "partOfSpeech")));
                entry.setMeaningSource("story");
                deduped.put(wordKey, entry);
            }
            payload.getGlossary().addAll(deduped.values());
        }
        return payload;
    }

    public void applySentenceTranslations(List<StorySentenceDTO> sentences, List<String> sentenceTranslations) {
        if (sentences == null || sentences.isEmpty() || sentenceTranslations == null || sentenceTranslations.isEmpty()) {
            return;
        }
        int limit = Math.min(sentences.size(), sentenceTranslations.size());
        for (int i = 0; i < limit; i++) {
            String vi = sentenceTranslations.get(i);
            if (vi != null && !vi.isBlank()) {
                sentences.get(i).setTextVi(vi.trim());
            }
        }
    }

    public List<StoryGlossaryEntryDTO> buildReaderGlossary(
            List<StoryTokenDTO> tokens, StoryTranslationsPayloadDTO translations) {
        Map<String, StoryGlossaryEntryDTO> merged = new LinkedHashMap<>();

        if (translations != null && translations.getGlossary() != null) {
            for (StoryGlossaryEntryDTO entry : translations.getGlossary()) {
                if (entry.getWordKey() != null && !entry.getWordKey().isBlank()) {
                    merged.put(entry.getWordKey(), entry);
                }
            }
        }

        Map<String, UUID> tokenVocabIds = new HashMap<>();
        if (tokens != null) {
            for (StoryTokenDTO token : tokens) {
                if (!"word".equals(token.getType()) || token.getText() == null) {
                    continue;
                }
                String wordKey = StoryWordKeyUtil.toWordKey(token.getText());
                if (wordKey.isBlank()) {
                    continue;
                }
                if (token.getVocabularyId() != null) {
                    tokenVocabIds.put(wordKey, token.getVocabularyId());
                }
                merged.computeIfAbsent(wordKey, key -> {
                    StoryGlossaryEntryDTO entry = new StoryGlossaryEntryDTO();
                    entry.setWordKey(key);
                    entry.setWordEn(token.getText().trim());
                    entry.setMeaningSource("story");
                    return entry;
                });
            }
        }

        for (Map.Entry<String, UUID> vocabEntry : tokenVocabIds.entrySet()) {
            vocabularyWordRepository.findByIdAndVoidedFalse(vocabEntry.getValue()).ifPresent(word -> {
                StoryGlossaryEntryDTO entry = merged.computeIfAbsent(vocabEntry.getKey(), key -> {
                    StoryGlossaryEntryDTO created = new StoryGlossaryEntryDTO();
                    created.setWordKey(key);
                    created.setWordEn(word.getWordEn());
                    return created;
                });
                mergeVocabWord(entry, word);
            });
        }

        for (StoryGlossaryEntryDTO entry : merged.values()) {
            if (entry.getPhonetic() == null || entry.getPhonetic().isBlank()) {
                enrichPhoneticFromDictionary(entry);
            }
        }

        return new ArrayList<>(merged.values());
    }

    private void mergeVocabWord(StoryGlossaryEntryDTO entry, VocabularyWord word) {
        entry.setVocabularyId(word.getId());
        entry.setWordEn(word.getWordEn());
        if (word.getMeaningVi() != null && !word.getMeaningVi().isBlank()) {
            entry.setMeaningVi(word.getMeaningVi().trim());
            entry.setMeaningSource("db");
        }
        entry.setPhonetic(word.getPhonetic());
        entry.setAudioUkUrl(word.getAudioUkUrl());
        entry.setAudioUsUrl(word.getAudioUsUrl());
        if (word.getPartOfSpeech() != null && !word.getPartOfSpeech().isBlank()) {
            entry.setPartOfSpeech(word.getPartOfSpeech());
        }
        entry.setMeaningSource(entry.getMeaningVi() != null ? "db" : entry.getMeaningSource());
    }

    private void enrichPhoneticFromDictionary(StoryGlossaryEntryDTO entry) {
        if (entry.getWordEn() == null || entry.getWordEn().isBlank()) {
            return;
        }
        Optional<VocabularyEnrichmentData> enrichment = dictionaryLookupService.lookup(entry.getWordEn());
        if (enrichment.isEmpty()) {
            return;
        }
        VocabularyEnrichmentData data = enrichment.get();
        if (entry.getPhonetic() == null || entry.getPhonetic().isBlank()) {
            entry.setPhonetic(data.getPhonetic());
        }
        if (entry.getAudioUkUrl() == null || entry.getAudioUkUrl().isBlank()) {
            entry.setAudioUkUrl(data.getAudioUkUrl());
        }
        if (entry.getAudioUsUrl() == null || entry.getAudioUsUrl().isBlank()) {
            entry.setAudioUsUrl(data.getAudioUsUrl());
        }
        if (entry.getPartOfSpeech() == null || entry.getPartOfSpeech().isBlank()) {
            entry.setPartOfSpeech(data.getPartOfSpeech());
        }
    }

    private static String textOrBlank(JsonNode root, String field) {
        if (root == null || !root.has(field) || root.get(field).isNull()) {
            return "";
        }
        return root.get(field).asText("").trim();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
