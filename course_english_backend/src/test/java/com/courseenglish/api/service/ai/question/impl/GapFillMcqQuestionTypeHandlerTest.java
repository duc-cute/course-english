package com.courseenglish.api.service.ai.question.impl;

import com.courseenglish.api.service.ai.question.dto.AiDraftQuestionDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

class GapFillMcqQuestionTypeHandlerTest {

  private final GapFillMcqQuestionTypeHandler handler = new GapFillMcqQuestionTypeHandler();
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void validatesClozeWithFourChoicesPerBlank() throws Exception {
    String json =
        """
        {
          "questionType": "GAP_FILL_MCQ",
          "promptText": "Tom is ___ student. He is ___ tall.",
          "contentJson": {
            "blanks": [
              {
                "choices": [
                  { "choiceText": "a", "correct": false },
                  { "choiceText": "an", "correct": true },
                  { "choiceText": "the", "correct": false },
                  { "choiceText": "one", "correct": false }
                ]
              },
              {
                "choices": [
                  { "choiceText": "very", "correct": true },
                  { "choiceText": "much", "correct": false },
                  { "choiceText": "too", "correct": false },
                  { "choiceText": "so", "correct": false }
                ]
              }
            ]
          }
        }
        """;
    AiDraftQuestionDTO draft = objectMapper.readValue(json, AiDraftQuestionDTO.class);
    handler.normalize(draft);
    List<String> errors = handler.validate(draft);
    assertTrue(errors.isEmpty(), () -> String.join("; ", errors));
  }
}
