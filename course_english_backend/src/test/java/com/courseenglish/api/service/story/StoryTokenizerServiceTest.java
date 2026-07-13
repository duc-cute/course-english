package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.dto.story.StorySentenceDTO;
import com.courseenglish.api.domain.dto.story.StoryTokenDTO;
import com.courseenglish.api.domain.dto.story.StoryTokensPayloadDTO;
import com.courseenglish.api.repository.VocabularySetMemberRepository;
import com.courseenglish.api.repository.VocabularyWordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StoryTokenizerServiceTest {

    @Mock
    private VocabularySetMemberRepository vocabularySetMemberRepository;

    @Mock
    private VocabularyWordRepository vocabularyWordRepository;

    private StoryTokenizerService tokenizerService;

    @BeforeEach
    void setUp() {
        tokenizerService = new StoryTokenizerService(vocabularySetMemberRepository, vocabularyWordRepository);
    }

    @Test
    void tokenizeAssignsWordIndexAndHighlightsKnownWords() {
        UUID passportId = UUID.randomUUID();
        when(vocabularyWordRepository.findByWordKeyInAndVoidedFalse(any(Set.class)))
                .thenReturn(List.of(word("passport", passportId)));

        StoryTokensPayloadDTO payload = tokenizerService.tokenize(
                "Tom showed his passport before entering the gate.",
                null);

        List<StoryTokenDTO> tokens = payload.getTokens();
        assertFalse(tokens.isEmpty());

        StoryTokenDTO passport = tokens.stream()
                .filter(t -> "word".equals(t.getType()) && "passport".equals(t.getText()))
                .findFirst()
                .orElseThrow();
        assertEquals(passportId, passport.getVocabularyId());
        assertTrue(passport.getIsVocab());
        assertEquals(3, passport.getWordIndex());

        StoryTokenDTO gate = tokens.stream()
                .filter(t -> "word".equals(t.getType()) && "gate".equals(t.getText()))
                .findFirst()
                .orElseThrow();
        assertFalse(gate.getIsVocab());

        assertEquals(1, payload.getSentences().size());
        assertEquals(0, payload.getSentences().get(0).getStartWordIndex());
        assertEquals(7, payload.getSentences().get(0).getEndWordIndex());
    }

    @Test
    void tokenizeEmptyContentReturnsEmptyPayload() {
        StoryTokensPayloadDTO payload = tokenizerService.tokenize("", null);
        assertTrue(payload.getTokens().isEmpty());
        assertTrue(payload.getSentences().isEmpty());
    }

    @Test
    void tokenizeSplitsDialogueEndingWithQuoteAfterPunctuation() {
        String content =
                "Smoke came out of the top. \"We must be inside a volcano!\" Emma said. "
                        + "\"Let's observe\" Max said. He picked up a black stone.";

        StoryTokensPayloadDTO payload = tokenizerService.tokenize(content, null);
        List<StorySentenceDTO> sentences = payload.getSentences();

        assertEquals(5, sentences.size());
        assertEquals("Smoke came out of the top.", sentences.get(0).getText());
        assertEquals("\"We must be inside a volcano!\"", sentences.get(1).getText());
        assertEquals("Emma said.", sentences.get(2).getText());
        assertEquals("\"Let's observe\" Max said.", sentences.get(3).getText());
        assertEquals("He picked up a black stone.", sentences.get(4).getText());
    }

    @Test
    void tokenizeWithVocabSetUsesSetLookupOnly() {
        UUID setId = UUID.randomUUID();
        when(vocabularySetMemberRepository.findResolvedBySetId(setId)).thenReturn(List.of());

        StoryTokensPayloadDTO payload = tokenizerService.tokenize("Hello world.", setId);

        long vocabHits = payload.getTokens().stream()
                .filter(t -> "word".equals(t.getType()) && Boolean.TRUE.equals(t.getIsVocab()))
                .count();
        assertEquals(0, vocabHits);
    }

    private static com.courseenglish.api.domain.VocabularyWord word(String wordEn, UUID id) {
        com.courseenglish.api.domain.VocabularyWord word = new com.courseenglish.api.domain.VocabularyWord();
        word.setId(id);
        word.setWordEn(wordEn);
        word.setWordKey(wordEn.toLowerCase());
        word.setVoided(false);
        return word;
    }
}
