package com.courseenglish.api.service.ai.vocabulary;

import com.courseenglish.api.service.ai.vocabulary.dto.AiVocabularySetGenEnvelopeDTO;
import com.courseenglish.api.service.ai.vocabulary.dto.AiVocabularySetItemDTO;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AiVocabularySetGenResultValidatorTest {

  private AiVocabularySetGenResultValidator validator;

  @BeforeEach
  void setUp() {
    validator = new AiVocabularySetGenResultValidator(new ObjectMapper());
  }

  @Test
  void parseAndValidate_acceptsValidPayload() throws IdInvalidException {
    String json =
        """
        {
          "title": "Từ vựng sân bay",
          "description": "Các từ thường gặp khi đi máy bay",
          "items": [
            { "wordEn": "boarding pass", "meaningVi": "thẻ lên máy bay" },
            { "wordEn": "gate", "meaningVi": "cổng lên máy bay" }
          ]
        }
        """;

    AiVocabularySetGenEnvelopeDTO envelope = validator.parseAndValidate(json, 2);

    assertEquals("Từ vựng sân bay", envelope.getTitle());
    assertEquals(2, envelope.getItems().size());
    assertEquals("gate", envelope.getItems().get(1).getWordEn());
  }

  @Test
  void parseAndValidate_rejectsDuplicateWords() {
    String json =
        """
        {
          "title": "Test",
          "description": "Desc",
          "items": [
            { "wordEn": "delay", "meaningVi": "trì hoãn" },
            { "wordEn": "Delay", "meaningVi": "chậm trễ" }
          ]
        }
        """;

    assertThrows(IdInvalidException.class, () -> validator.parseAndValidate(json, 2));
  }

  @Test
  void parseAndValidate_rejectsWrongItemCount() {
    String json =
        """
        {
          "title": "Test",
          "description": "Desc",
          "items": [
            { "wordEn": "one", "meaningVi": "một" }
          ]
        }
        """;

    IdInvalidException ex =
        assertThrows(IdInvalidException.class, () -> validator.parseAndValidate(json, 3));
    assertEquals("AI trả 1 từ, yêu cầu đúng 3 từ", ex.getMessage());
  }

  @Test
  void parseAndValidate_acceptsPhase2Fields() throws IdInvalidException {
    String json =
        """
        {
          "title": "Từ vựng sân bay",
          "description": "Các từ thường gặp khi đi máy bay",
          "coverImagePrompt": "Airport terminal with planes, flat illustration",
          "items": [
            {
              "wordEn": "boarding pass",
              "meaningVi": "thẻ lên máy bay",
              "phonetic": "ˈbɔː.dɪŋ pɑːs",
              "partOfSpeech": "noun",
              "exampleSentence": "Please show your boarding pass at the gate."
            }
          ]
        }
        """;

    AiVocabularySetGenEnvelopeDTO envelope = validator.parseAndValidate(json, 1);

    assertEquals("Airport terminal with planes, flat illustration", envelope.getCoverImagePrompt());
    AiVocabularySetItemDTO item = envelope.getItems().get(0);
    assertEquals("/ˈbɔː.dɪŋ pɑːs/", item.getPhonetic());
    assertEquals("noun", item.getPartOfSpeech());
    assertEquals("Please show your boarding pass at the gate.", item.getExampleSentence());
  }

  @Test
  void parseAndValidate_keepsPhoneticSlashes() throws IdInvalidException {
    String json =
        """
        {
          "title": "Energy",
          "description": "Desc",
          "items": [
            {
              "wordEn": "solar power",
              "meaningVi": "năng lượng mặt trời",
              "phonetic": "/ˈsəʊ.lə ˈpaʊə/"
            }
          ]
        }
        """;

    AiVocabularySetGenEnvelopeDTO envelope = validator.parseAndValidate(json, 1);
    assertEquals("/ˈsəʊ.lə ˈpaʊə/", envelope.getItems().get(0).getPhonetic());
  }

  @Test
  void parseAndValidate_fillsDefaultDescriptionWhenMissing() throws IdInvalidException {
    String json =
        """
        {
          "title": "Test",
          "items": [
            { "wordEn": "hello", "meaningVi": "xin chào" }
          ]
        }
        """;

    AiVocabularySetGenEnvelopeDTO envelope = validator.parseAndValidate(json, 1);
    assertEquals("Bộ từ vựng do AI sinh", envelope.getDescription());
  }
}
