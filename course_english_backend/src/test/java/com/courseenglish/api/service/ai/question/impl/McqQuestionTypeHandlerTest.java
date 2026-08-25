package com.courseenglish.api.service.ai.question.impl;

import com.courseenglish.api.service.ai.question.dto.AiDraftChoiceDTO;
import com.courseenglish.api.service.ai.question.dto.AiDraftQuestionDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class McqQuestionTypeHandlerTest {

  private final ObjectMapper objectMapper = new ObjectMapper();
  private final McqQuestionTypeHandler handler = new McqQuestionTypeHandler(objectMapper);

  @Test
  void normalizeSplitsFlatArrangementPromptIntoItems() {
    AiDraftQuestionDTO draft = new AiDraftQuestionDTO();
    draft.setPromptText(
        """
        Mark the letter A, B, C or D to indicate the correct arrangement.
        a. She opened the door.
        b. Then she turned on the light.
        c. It was dark inside.
        d. Someone was waiting.
        e. Finally she smiled.
        a. c – a – b – d – e
        b. a – c – b – e – d
        c. d – e – b – c – a
        d. b – e – d – c – a
        """);
    draft.setChoices(
        List.of(
            choice("a", "c – a – b – d – e", false),
            choice("b", "a – c – b – e – d", true),
            choice("c", "d – e – b – c – a", false),
            choice("d", "b – e – d – c – a", false)));

    handler.normalize(draft);

    assertEquals("Mark the letter A, B, C or D to indicate the correct arrangement.", draft.getPromptText());
    assertEquals("SENTENCE_ARRANGEMENT", draft.getContentJson().path("layout").asText());
    assertEquals(5, draft.getContentJson().path("items").size());
    assertEquals("a", draft.getContentJson().path("items").get(0).path("key").asText());
    assertEquals("She opened the door.", draft.getContentJson().path("items").get(0).path("text").asText());
    assertEquals("Finally she smiled.", draft.getContentJson().path("items").get(4).path("text").asText());
    assertTrue(handler.validate(draft).isEmpty(), () -> String.join("; ", handler.validate(draft)));
  }

  @Test
  void standardMcqClearsContentJson() {
    AiDraftQuestionDTO draft = new AiDraftQuestionDTO();
    draft.setPromptText("She ___ to school every day.");
    draft.setChoices(
        List.of(
            choice("a", "go", false),
            choice("b", "goes", true),
            choice("c", "going", false),
            choice("d", "went", false)));
    draft.setContentJson(objectMapper.createObjectNode().put("noise", true));

    handler.normalize(draft);

    assertEquals(null, draft.getContentJson());
    assertTrue(handler.validate(draft).isEmpty());
  }

  private static AiDraftChoiceDTO choice(String key, String text, boolean correct) {
    AiDraftChoiceDTO c = new AiDraftChoiceDTO();
    c.setChoiceKey(key);
    c.setChoiceText(text);
    c.setCorrect(correct);
    return c;
  }
}
