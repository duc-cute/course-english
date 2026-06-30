package com.courseenglish.api.service.ai.question.impl;

import com.courseenglish.api.service.ai.question.AiQuestionTypeHandler;
import com.courseenglish.api.service.ai.question.dto.AiDraftQuestionDTO;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class GapFillMcqQuestionTypeHandler implements AiQuestionTypeHandler {

  private static final Pattern BLANK_RUN_RE = Pattern.compile("_{3,}");
  private static final int MIN_BLANKS = 2;
  private static final int MAX_BLANKS = 12;
  private static final String[] CHOICE_KEYS = {"a", "b", "c", "d"};

  @Override
  public QuestionTypeEnum supportedType() {
    return QuestionTypeEnum.GAP_FILL_MCQ;
  }

  @Override
  public String promptSchemaFragment() {
    return """
        GAP_FILL_MCQ (cloze — choose A/B/C/D per blank, NOT typed answers):
        - ONE passage in promptText with exactly three underscores "___" per blank slot
        - contentJson: { "blanks": [ { "choices": [4 items with choiceText + correct] } ] }
        - blanks.length must equal the number of ___ in promptText
        - Each blank: exactly 4 choices, exactly one correct: true
        - Extract options A/B/C/D from source for each numbered blank when present
        - Do NOT use FILL_BLANK (typing) for Mark-letter-A-B-C-D cloze sections
        - Do NOT output blank id or choiceKey — server assigns b1.. and a..d
        """;
  }

  @Override
  public String promptExampleJson() {
    return """
        {
          "questionType": "GAP_FILL_MCQ",
          "promptText": "Psychology of Money is ___ (6) popular book. Many readers find it ___ (7) insightful.",
          "explanation": "Chọn từ phù hợp ngữ cảnh trong đoạn văn (mạo từ và tính từ trong câu).",
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
        }""";
  }

  @Override
  public void normalize(AiDraftQuestionDTO draft) {
    draft.setChoices(null);
    if (draft.getPromptText() != null) {
      draft.setPromptText(normalizeBlankRuns(draft.getPromptText()));
    }
    JsonNode node = draft.getContentJson();
    if (node == null || !node.isObject() || !node.has("blanks") || !node.get("blanks").isArray()) {
      return;
    }
    ArrayNode blanks = (ArrayNode) node.get("blanks");
    for (int i = 0; i < blanks.size(); i++) {
      JsonNode blank = blanks.get(i);
      if (!blank.isObject()) {
        continue;
      }
      ObjectNode blankObj = (ObjectNode) blank;
      if (!blankObj.has("id") || blankObj.get("id").asText("").isBlank()) {
        blankObj.put("id", "b" + (i + 1));
      }
      normalizeBlankChoices(blankObj);
    }
  }

  @Override
  public List<String> validate(AiDraftQuestionDTO draft) {
    List<String> errors = new ArrayList<>();
    String prompt = draft.getPromptText();
    if (prompt == null || prompt.isBlank()) {
      errors.add("Thiếu đoạn văn cloze");
      return errors;
    }
    int placeholderCount = countBlanks(prompt);
    if (placeholderCount < MIN_BLANKS) {
      errors.add("GAP_FILL_MCQ cần ít nhất " + MIN_BLANKS + " chỗ trống ___");
    }
    if (placeholderCount > MAX_BLANKS) {
      errors.add("Tối đa " + MAX_BLANKS + " chỗ trống");
    }
    JsonNode node = draft.getContentJson();
    if (node == null || !node.has("blanks") || !node.get("blanks").isArray()) {
      errors.add("Thiếu contentJson.blanks");
      return errors;
    }
    JsonNode blanks = node.get("blanks");
    if (placeholderCount > 0 && blanks.size() != Math.min(placeholderCount, MAX_BLANKS)) {
      errors.add("Số blanks không khớp số dấu ___");
    }
    for (int i = 0; i < blanks.size(); i++) {
      errors.addAll(validateBlank(blanks.get(i), i + 1));
    }
    return errors;
  }

  private List<String> validateBlank(JsonNode blank, int index) {
    List<String> errors = new ArrayList<>();
    String prefix = "Ô " + index + ": ";
    if (blank == null || !blank.isObject()) {
      errors.add(prefix + "không hợp lệ");
      return errors;
    }
    JsonNode choices = blank.get("choices");
    if (choices == null || !choices.isArray() || choices.size() != 4) {
      errors.add(prefix + "cần đúng 4 đáp án");
      return errors;
    }
    int correctCount = 0;
    for (int i = 0; i < choices.size(); i++) {
      JsonNode choice = choices.get(i);
      if (choice == null || !choice.isObject()) {
        errors.add(prefix + "đáp án " + (i + 1) + " không hợp lệ");
        continue;
      }
      if (!choice.has("choiceText") || choice.get("choiceText").asText("").isBlank()) {
        errors.add(prefix + "đáp án " + (i + 1) + ": thiếu nội dung");
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

  private void normalizeBlankChoices(ObjectNode blankObj) {
    JsonNode choices = blankObj.get("choices");
    if (choices == null || !choices.isArray()) {
      return;
    }
    for (int i = 0; i < choices.size() && i < CHOICE_KEYS.length; i++) {
      JsonNode choice = choices.get(i);
      if (choice instanceof ObjectNode choiceObj) {
        if (!choiceObj.has("choiceKey") || choiceObj.get("choiceKey").asText("").isBlank()) {
          choiceObj.put("choiceKey", CHOICE_KEYS[i]);
        }
      }
    }
  }

  private int countBlanks(String promptText) {
    Matcher matcher = BLANK_RUN_RE.matcher(promptText);
    int count = 0;
    while (matcher.find()) {
      count++;
    }
    return count;
  }

  private String normalizeBlankRuns(String promptText) {
    return BLANK_RUN_RE.matcher(promptText).replaceAll("___");
  }
}
