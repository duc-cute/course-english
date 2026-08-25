package com.courseenglish.api.service.exam;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ExamAttemptScoringServiceTest {

  private final ObjectMapper objectMapper = new ObjectMapper();
  private final ExamAttemptScoringService scoring = new ExamAttemptScoringService(objectMapper);

  @Test
  void scoresMcqUsingCorrectChoiceId() {
    String payload =
        """
        {
          "questions": [
            {
              "id": "q1",
              "type": "MULTIPLE_CHOICE",
              "correctChoiceId": "b",
              "choices": [
                { "id": "a", "text": "wrong" },
                { "id": "b", "text": "right" },
                { "id": "c", "text": "no" },
                { "id": "d", "text": "no" }
              ]
            },
            {
              "id": "q2",
              "type": "MULTIPLE_CHOICE",
              "correctChoiceId": "a",
              "choices": [
                { "id": "a", "text": "yes" },
                { "id": "b", "text": "no" }
              ]
            }
          ]
        }
        """;

    Map<String, Object> answers =
        Map.of(
            "answers",
            Map.of(
                "q1", Map.of("selectedChoiceId", "b", "correct", true),
                "q2", Map.of("selectedChoiceId", "b", "correct", false)));

    ExamAttemptScoringService.ScoreResult result = scoring.score(List.of(payload), answers, 80);
    assertEquals(2, result.totalUnits());
    assertEquals(1, result.correctUnits());
    assertEquals(50, result.scorePercent());
  }

  @Test
  void scoresGapFillMcqUsingBlankCorrectChoiceId() {
    String payload =
        """
        {
          "questions": [
            {
              "id": "g1",
              "type": "GAP_FILL_MCQ",
              "blanks": [
                {
                  "id": "b1",
                  "correctChoiceId": "a",
                  "choices": [
                    { "id": "a", "text": "an" },
                    { "id": "b", "text": "a" }
                  ]
                },
                {
                  "id": "b2",
                  "correctChoiceId": "b",
                  "choices": [
                    { "id": "a", "text": "much" },
                    { "id": "b", "text": "very" }
                  ]
                }
              ]
            }
          ]
        }
        """;

    Map<String, Object> answers =
        Map.of(
            "answers",
            Map.of(
                "g1",
                Map.of(
                    "correct", false,
                    "gapFillMcqAnswers", Map.of("b1", "a", "b2", "a"))));

    ExamAttemptScoringService.ScoreResult result = scoring.score(List.of(payload), answers, 50);
    assertEquals(2, result.totalUnits());
    assertEquals(1, result.correctUnits());
    assertEquals(50, result.scorePercent());
    assertTrue(result.passed());
  }

  @Test
  void scoresReadingUsingSubCorrectChoiceId() {
    String payload =
        """
        {
          "questions": [
            {
              "id": "r1",
              "type": "READING_COMPREHENSION",
              "subQuestions": [
                {
                  "id": "sq1",
                  "correctChoiceId": "c",
                  "choices": [
                    { "id": "a", "text": "A" },
                    { "id": "c", "text": "C" }
                  ]
                },
                {
                  "id": "sq2",
                  "correctChoiceId": "a",
                  "choices": [
                    { "id": "a", "text": "A" },
                    { "id": "b", "text": "B" }
                  ]
                }
              ]
            }
          ]
        }
        """;

    Map<String, Object> answers =
        Map.of(
            "answers",
            Map.of(
                "r1",
                Map.of(
                    "correct", true,
                    "readingSubAnswers", Map.of("sq1", "c", "sq2", "a"))));

    ExamAttemptScoringService.ScoreResult result = scoring.score(List.of(payload), answers, 80);
    assertEquals(2, result.totalUnits());
    assertEquals(2, result.correctUnits());
    assertEquals(100, result.scorePercent());
  }
}
