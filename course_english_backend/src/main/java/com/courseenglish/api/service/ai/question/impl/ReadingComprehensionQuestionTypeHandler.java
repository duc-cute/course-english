package com.courseenglish.api.service.ai.question.impl;

import com.courseenglish.api.service.ai.question.AiQuestionTypeHandler;
import com.courseenglish.api.service.ai.question.dto.AiDraftQuestionDTO;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class ReadingComprehensionQuestionTypeHandler implements AiQuestionTypeHandler {

  private static final String[] KEYS = {"a", "b", "c", "d"};
  private static final int MIN_SUB_QUESTIONS = 2;
  private static final int MAX_SUB_QUESTIONS = 12;
  private static final int REQUIRED_CHOICES = 4;

  @Override
  public QuestionTypeEnum supportedType() {
    return QuestionTypeEnum.READING_COMPREHENSION;
  }

  @Override
  public String promptSchemaFragment() {
    return """
        READING_COMPREHENSION:
        - One item = one reading passage + multiple sub-questions (not separate top-level items per sub-question)
        - promptText: optional short title for the passage (or leave empty)
        - contentJson:
          {
            "passage": { "title": "", "text": "full passage from document", "lang": "en" },
            "presentation": "split",
            "subQuestions": [
              {
                "id": "sq1",
                "promptText": "According to the passage, ...",
                "promptLang": "en",
                "choices": [
                  { "choiceKey": "a", "choiceText": "...", "correct": false, "displayOrder": 0 },
                  { "choiceKey": "b", "choiceText": "...", "correct": true, "displayOrder": 1 },
                  { "choiceKey": "c", "choiceText": "...", "correct": false, "displayOrder": 2 },
                  { "choiceKey": "d", "choiceText": "...", "correct": false, "displayOrder": 3 }
                ],
                "explanation": "..."
              }
            ]
          }
        - passage.text must be copied or closely paraphrased from the document excerpt
        - Each subQuestion needs exactly 4 choices and exactly one correct: true
        - For true/false statements about the passage, use 4 choices e.g. True, False, Not given, Not stated
        - Do NOT use choices[] at the top level
        """;
  }

  @Override
  public String promptExampleJson() {
    return """
        {
          "tempId": "q1",
          "selected": true,
          "questionType": "READING_COMPREHENSION",
          "promptText": "Family and social media",
          "promptLang": "en",
          "explanation": "",
          "difficulty": 2,
          "contentJson": {
            "passage": {
              "title": "Family and social media",
              "text": "Every morning, Tom wakes up at six o'clock. He brushes his teeth and eats breakfast with his family. Then he walks to school with his best friend, Anna.",
              "lang": "en"
            },
            "presentation": "split",
            "subQuestions": [
              {
                "id": "sq1",
                "promptText": "What time does Tom wake up?",
                "promptLang": "en",
                "choices": [
                  { "choiceKey": "a", "choiceText": "6 o'clock", "correct": true, "displayOrder": 0 },
                  { "choiceKey": "b", "choiceText": "7 o'clock", "correct": false, "displayOrder": 1 },
                  { "choiceKey": "c", "choiceText": "8 o'clock", "correct": false, "displayOrder": 2 },
                  { "choiceKey": "d", "choiceText": "9 o'clock", "correct": false, "displayOrder": 3 }
                ],
                "explanation": "The passage says six o'clock."
              },
              {
                "id": "sq2",
                "promptText": "Tom walks to school alone.",
                "promptLang": "en",
                "choices": [
                  { "choiceKey": "a", "choiceText": "True", "correct": false, "displayOrder": 0 },
                  { "choiceKey": "b", "choiceText": "False", "correct": true, "displayOrder": 1 },
                  { "choiceKey": "c", "choiceText": "Not given", "correct": false, "displayOrder": 2 },
                  { "choiceKey": "d", "choiceText": "Not stated", "correct": false, "displayOrder": 3 }
                ],
                "explanation": "He walks with Anna."
              }
            ]
          }
        }""";
  }

  @Override
  public void normalize(AiDraftQuestionDTO draft) {
    draft.setChoices(null);
    JsonNode node = draft.getContentJson();
    if (node == null || !node.isObject()) {
      return;
    }
    ObjectNode root = (ObjectNode) node;
    JsonNode passage = root.get("passage");
    if (passage != null && passage.isObject()) {
      ObjectNode passageObj = (ObjectNode) passage;
      if ((!passageObj.has("title") || passageObj.get("title").asText("").isBlank())
          && draft.getPromptText() != null
          && !draft.getPromptText().isBlank()) {
        passageObj.put("title", draft.getPromptText().trim());
      }
      if (!passageObj.has("lang") || passageObj.get("lang").asText("").isBlank()) {
        passageObj.put("lang", draft.getPromptLang() != null ? draft.getPromptLang() : "en");
      }
    }
    if (!root.has("presentation") || root.get("presentation").asText("").isBlank()) {
      root.put("presentation", "split");
    }
    JsonNode subs = root.get("subQuestions");
    if (subs != null && subs.isArray()) {
      for (int i = 0; i < subs.size(); i++) {
        JsonNode sub = subs.get(i);
        if (!sub.isObject()) {
          continue;
        }
        ObjectNode subObj = (ObjectNode) sub;
        if (!subObj.has("id") || subObj.get("id").asText("").isBlank()) {
          subObj.put("id", "sq" + (i + 1));
        }
        normalizeSubChoices(subObj);
      }
    }
  }

  @Override
  public List<String> validate(AiDraftQuestionDTO draft) {
    List<String> errors = new ArrayList<>();
    JsonNode node = draft.getContentJson();
    if (node == null || !node.isObject()) {
      errors.add("Thiếu contentJson (passage + subQuestions)");
      return errors;
    }
    JsonNode passage = node.get("passage");
    String passageText =
        passage != null && passage.isObject() ? passage.path("text").asText("").trim() : "";
    if (passageText.isBlank()) {
      errors.add("Thiếu đoạn đọc (contentJson.passage.text)");
    }
    JsonNode subs = node.get("subQuestions");
    if (subs == null || !subs.isArray() || subs.isEmpty()) {
      errors.add("Cần ít nhất một câu hỏi con");
      return errors;
    }
    if (subs.size() < MIN_SUB_QUESTIONS) {
      errors.add("Đọc hiểu cần ít nhất " + MIN_SUB_QUESTIONS + " câu con");
    }
    if (subs.size() > MAX_SUB_QUESTIONS) {
      errors.add("Tối đa " + MAX_SUB_QUESTIONS + " câu con");
    }
    for (int i = 0; i < subs.size(); i++) {
      errors.addAll(validateSubQuestion(subs.get(i), i + 1));
    }
    return errors;
  }

  private List<String> validateSubQuestion(JsonNode sub, int index) {
    List<String> errors = new ArrayList<>();
    String prefix = "Câu con " + index + ": ";
    if (sub == null || !sub.isObject()) {
      errors.add(prefix + "không hợp lệ");
      return errors;
    }
    String promptText = sub.path("promptText").asText("").trim();
    if (promptText.isBlank()) {
      errors.add(prefix + "thiếu promptText");
    }
    JsonNode choices = sub.get("choices");
    if (choices == null || !choices.isArray()) {
      errors.add(prefix + "thiếu choices");
      return errors;
    }
    if (choices.size() != REQUIRED_CHOICES) {
      errors.add(prefix + "cần đúng 4 đáp án");
    }
    Set<String> keys = new HashSet<>();
    int correctCount = 0;
    for (int i = 0; i < choices.size(); i++) {
      JsonNode choice = choices.get(i);
      String key = choice.path("choiceKey").asText("").trim().toLowerCase();
      if (key.isBlank()) {
        errors.add(prefix + "đáp án " + (i + 1) + ": thiếu mã");
        continue;
      }
      if (!keys.add(key)) {
        errors.add(prefix + "mã đáp án \"" + key + "\" bị trùng");
      }
      if (choice.path("choiceText").asText("").isBlank()) {
        errors.add(prefix + "đáp án " + key + ": thiếu nội dung");
      }
      if (choice.path("correct").asBoolean(false)) {
        correctCount++;
      }
    }
    if (correctCount != 1) {
      errors.add(prefix + "cần đúng 1 đáp án đúng");
    }
    return errors;
  }

  private void normalizeSubChoices(ObjectNode subObj) {
    JsonNode choices = subObj.get("choices");
    if (choices == null || !choices.isArray()) {
      return;
    }
    for (int i = 0; i < choices.size(); i++) {
      JsonNode choice = choices.get(i);
      if (!choice.isObject()) {
        continue;
      }
      ObjectNode choiceObj = (ObjectNode) choice;
      String key = choiceObj.path("choiceKey").asText("").trim().toLowerCase();
      if (key.isBlank()) {
        choiceObj.put("choiceKey", i < KEYS.length ? KEYS[i] : "x" + (i + 1));
      } else {
        choiceObj.put("choiceKey", key);
      }
      if (!choiceObj.has("displayOrder")) {
        choiceObj.put("displayOrder", i);
      }
    }
  }
}
