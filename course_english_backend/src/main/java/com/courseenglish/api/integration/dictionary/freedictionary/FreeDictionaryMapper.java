package com.courseenglish.api.integration.dictionary.freedictionary;

import com.courseenglish.api.integration.dictionary.freedictionary.dto.FreeDictionaryEntryDto;
import com.courseenglish.api.integration.dictionary.freedictionary.dto.FreeDictionaryMeaningDto;
import com.courseenglish.api.integration.dictionary.freedictionary.dto.FreeDictionaryPhoneticDto;
import com.courseenglish.api.integration.dictionary.model.VocabularyEnrichmentData;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Maps Free Dictionary API JSON → {@link VocabularyEnrichmentData}.
 * Sample response: {@code course_english/data.md} / apple endpoint.
 */
@Component
public class FreeDictionaryMapper {

    public Optional<VocabularyEnrichmentData> mapFirstEntry(List<FreeDictionaryEntryDto> entries) {
        if (entries == null || entries.isEmpty()) {
            return Optional.empty();
        }
        return mapEntry(entries.get(0));
    }

    public Optional<VocabularyEnrichmentData> mapEntry(FreeDictionaryEntryDto entry) {
        if (entry == null) {
            return Optional.empty();
        }

        String phonetic = resolvePhonetic(entry);
        String audioUk = resolveAccentAudio(entry.getPhonetics(), "uk");
        String audioUs = resolveAccentAudio(entry.getPhonetics(), "us");
        String partOfSpeech = resolvePartOfSpeech(entry.getMeanings());

        if (isBlank(phonetic) && isBlank(audioUk) && isBlank(audioUs) && isBlank(partOfSpeech)) {
            return Optional.empty();
        }

        return Optional.of(VocabularyEnrichmentData.builder()
                .wordEn(entry.getWord())
                .phonetic(blankToNull(phonetic))
                .audioUkUrl(blankToNull(audioUk))
                .audioUsUrl(blankToNull(audioUs))
                .partOfSpeech(blankToNull(partOfSpeech))
                .enrichSource(FreeDictionaryClient.PROVIDER_ID)
                .build());
    }

    private String resolvePhonetic(FreeDictionaryEntryDto entry) {
        if (!isBlank(entry.getPhonetic())) {
            return entry.getPhonetic().trim();
        }
        if (entry.getPhonetics() == null) {
            return null;
        }
        return entry.getPhonetics().stream()
                .map(FreeDictionaryPhoneticDto::getText)
                .filter(text -> !isBlank(text))
                .findFirst()
                .map(String::trim)
                .orElse(null);
    }

    /**
     * Audio URLs follow {@code …/en/{word}-uk.mp3} and {@code …/en/{word}-us.mp3}.
     */
    static String resolveAccentAudio(List<FreeDictionaryPhoneticDto> phonetics, String accent) {
        if (phonetics == null || accent == null) {
            return null;
        }
        String suffix = "-" + accent.toLowerCase(Locale.ROOT) + ".mp3";
        for (FreeDictionaryPhoneticDto phonetic : phonetics) {
            String audio = phonetic.getAudio();
            if (!isBlank(audio) && audio.toLowerCase(Locale.ROOT).contains(suffix)) {
                return audio.trim();
            }
        }
        return null;
    }

    private String resolvePartOfSpeech(List<FreeDictionaryMeaningDto> meanings) {
        if (meanings == null || meanings.isEmpty()) {
            return null;
        }
        Optional<String> noun = meanings.stream()
                .map(FreeDictionaryMeaningDto::getPartOfSpeech)
                .filter(pos -> pos != null && pos.equalsIgnoreCase("noun"))
                .findFirst();
        if (noun.isPresent()) {
            return noun.get();
        }
        return meanings.stream()
                .map(FreeDictionaryMeaningDto::getPartOfSpeech)
                .filter(pos -> !isBlank(pos))
                .findFirst()
                .orElse(null);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String blankToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }
}
