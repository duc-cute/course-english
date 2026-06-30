package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.response.ResExamSectionDTO;
import com.courseenglish.api.service.ExamSectionPayloadValidator;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ExamPaperReferenceExcerptBuilderTest {

  private ExamPaperReferenceExcerptBuilder builder;

  @BeforeEach
  void setUp() {
    ObjectMapper objectMapper = new ObjectMapper();
    builder =
        new ExamPaperReferenceExcerptBuilder(objectMapper, new ExamSectionPayloadValidator(objectMapper));
  }

  @Test
  void redactsCorrectChoiceIdFromMcqPayload() throws Exception {
    String payload =
        """
        {
          "questions": [
            {
              "type": "MULTIPLE_CHOICE",
              "promptText": "Choose the synonym",
              "choices": [
                { "id": "a", "choiceText": "happy" },
                { "id": "b", "choiceText": "sad" }
              ],
              "correctChoiceId": "a"
            }
          ]
        }
        """;

    ResExamSectionDTO section = new ResExamSectionDTO();
    section.setTitle("Synonyms");
    section.setQuestionType(QuestionTypeEnum.MULTIPLE_CHOICE);
    section.setPayloadJson(payload);

    String excerpt = builder.buildReferenceExcerpt(section);

    assertFalse(excerpt.contains("correctChoiceId"));
    assertTrue(excerpt.contains("happy"));
  }

  @Test
  void resolveReadingCountsForMultiplePassages() {
    String payload =
        """
        {
          "questions": [
            {
              "type": "READING_COMPREHENSION",
              "contentJson": {
                "passage": "Passage one",
                "subQuestions": [
                  { "promptText": "Q1" },
                  { "promptText": "Q2" },
                  { "promptText": "Q3" }
                ]
              }
            },
            {
              "type": "READING_COMPREHENSION",
              "contentJson": {
                "passage": "Passage two",
                "subQuestions": [
                  { "promptText": "Q4" },
                  { "promptText": "Q5" }
                ]
              }
            }
          ]
        }
        """;

    ExamPaperReferenceExcerptBuilder.ReadingGenCounts counts = builder.resolveReadingCounts(payload);

    assertEquals(2, counts.passageCount());
    assertEquals(3, counts.subQuestionCount());
  }
}
