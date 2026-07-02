package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.Story;
import com.courseenglish.api.domain.dto.story.StorySentenceDTO;
import com.courseenglish.api.domain.dto.story.StoryTokenDTO;
import com.courseenglish.api.domain.dto.story.StoryTokensPayloadDTO;
import com.courseenglish.api.integration.speech.platform.SpeechPlatformProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class StorySpeechRequestAssemblerTest {

    private StorySpeechRequestAssembler assembler;

    @BeforeEach
    void setUp() {
        SpeechPlatformProperties properties = new SpeechPlatformProperties();
        properties.setDefaultVoice("en-US-AriaNeural");
        properties.setDefaultTtsProvider("edge");
        properties.setDefaultAlignmentProvider("faster-whisper");
        var repository = Mockito.mock(com.courseenglish.api.repository.TtsVoiceCatalogRepository.class);
        when(repository.findFirstByProfileKeyAndProviderAndVoidedFalseAndActiveTrueOrderByPriorityAsc(
                        anyString(), anyString()))
                .thenReturn(Optional.empty());
        assembler = new StorySpeechRequestAssembler(properties, repository, new ObjectMapper());
    }

    @Test
    void assemble_extractsWordTokensOnly() {
        Story story = new Story();
        story.setContent("Tom showed his passport.");

        StoryTokenDTO word = new StoryTokenDTO();
        word.setType("word");
        word.setText("Tom");
        word.setWordIndex(0);

        StoryTokenDTO text = new StoryTokenDTO();
        text.setType("text");
        text.setValue(" showed ");

        StoryTokensPayloadDTO payload = new StoryTokensPayloadDTO();
        payload.setTokens(List.of(word, text));

        var request = assembler.assemble(story, payload);

        assertEquals(1, request.getTokens().size());
        assertEquals("Tom", request.getTokens().get(0));
        assertEquals("Tom showed his passport.", request.getText());
    }

    @Test
    void contentHash_changesWhenContentChanges() {
        Story story = new Story();
        story.setContent("Hello");

        String hash1 = assembler.contentHash(story);
        story.setContent("Hello world");
        String hash2 = assembler.contentHash(story);

        assertFalse(hash1.equals(hash2));
    }

    @Test
    void assemble_mapsSentenceRefs() {
        Story story = new Story();
        story.setContent("Hi. Bye.");

        StorySentenceDTO sentence = new StorySentenceDTO();
        sentence.setSentenceIndex(0);
        sentence.setStartWordIndex(0);
        sentence.setEndWordIndex(0);

        StoryTokensPayloadDTO payload = new StoryTokensPayloadDTO();
        payload.setSentences(List.of(sentence));

        var request = assembler.assemble(story, payload);

        assertEquals(1, request.getSentences().size());
        assertEquals(0, request.getSentences().get(0).getSentenceIndex());
    }
}
