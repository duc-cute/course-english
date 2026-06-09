package com.courseenglish.api.integration.dictionary.freedictionary;

import com.courseenglish.api.integration.dictionary.freedictionary.dto.FreeDictionaryEntryDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class FreeDictionaryMapperTest {

    private FreeDictionaryMapper mapper;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mapper = new FreeDictionaryMapper();
        objectMapper = new ObjectMapper();
    }

    @Test
    void mapAppleSampleFromDataMd() throws Exception {
        List<FreeDictionaryEntryDto> entries;
        try (InputStream in = getClass().getResourceAsStream("/integration/freedictionary-apple-sample.json")) {
            assertNotNull(in, "sample JSON fixture missing");
            entries = objectMapper.readValue(in, new TypeReference<>() {
            });
        }

        Optional<com.courseenglish.api.integration.dictionary.model.VocabularyEnrichmentData> result =
                mapper.mapFirstEntry(entries);

        assertTrue(result.isPresent());
        var data = result.get();
        assertEquals("apple", data.getWordEn());
        assertEquals("/ˈæp.əl/", data.getPhonetic());
        assertEquals(
                "https://api.dictionaryapi.dev/media/pronunciations/en/apple-uk.mp3",
                data.getAudioUkUrl());
        assertEquals(
                "https://api.dictionaryapi.dev/media/pronunciations/en/apple-us.mp3",
                data.getAudioUsUrl());
        assertEquals("noun", data.getPartOfSpeech());
        assertEquals(FreeDictionaryClient.PROVIDER_ID, data.getEnrichSource());
    }

    @Test
    void resolveAccentAudio_picksUkAndUsSuffix() {
        var uk = FreeDictionaryMapper.resolveAccentAudio(
                List.of(phonetic("https://example/en/apple-uk.mp3", "/ˈæp.əl/")),
                "uk");
        var us = FreeDictionaryMapper.resolveAccentAudio(
                List.of(phonetic("https://example/en/apple-us.mp3", "/ˈæp.əl/")),
                "us");

        assertEquals("https://example/en/apple-uk.mp3", uk);
        assertEquals("https://example/en/apple-us.mp3", us);
    }

    private static com.courseenglish.api.integration.dictionary.freedictionary.dto.FreeDictionaryPhoneticDto phonetic(
            String audio, String text) {
        var dto = new com.courseenglish.api.integration.dictionary.freedictionary.dto.FreeDictionaryPhoneticDto();
        dto.setAudio(audio);
        dto.setText(text);
        return dto;
    }
}
