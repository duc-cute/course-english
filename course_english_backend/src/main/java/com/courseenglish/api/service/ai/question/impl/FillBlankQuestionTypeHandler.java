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
public class FillBlankQuestionTypeHandler implements AiQuestionTypeHandler {

  private static final Pattern BLANK_RUN_RE = Pattern.compile("_{3,}");
  private static final int MAX_BLANKS = 12;

  @Override
  public QuestionTypeEnum supportedType() {
    return QuestionTypeEnum.FILL_BLANK;
  }

  @Override
  public String promptSchemaFragment() {
    return """
        FILL_BLANK:
        - Use exactly three underscores "___" per blank (NOT "____" or "______")
        - contentJson: { "blanks": [{ "acceptedAnswers": ["answer"] }], "caseSensitive": false }
        - blanks.length must equal the number of blank placeholders in promptText
        - Do NOT output blank id — server assigns b1, b2, ...
        """;
  }

  @Override
  public String promptExampleJson() {
    return """
        {
          "questionType": "FILL_BLANK",
          "promptText": "I ___ (go) to the park yesterday.",
          "explanation": "Past simple of go.",
          "contentJson": {
            "blanks": [{ "acceptedAnswers": ["went"] }],
            "caseSensitive": false
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
    if (node != null && node.isObject() && node.has("blanks") && node.get("blanks").isArray()) {
      ArrayNode blanks = (ArrayNode) node.get("blanks");
      for (int i = 0; i < blanks.size(); i++) {
        JsonNode blank = blanks.get(i);
        if (blank.isObject()) {
          ObjectNode blankObj = (ObjectNode) blank;
          if (!blankObj.has("id") || blankObj.get("id").asText("").isBlank()) {
            blankObj.put("id", "b" + (i + 1));
          }
        }
      }
    }
  }

  @Override
  public List<String> validate(AiDraftQuestionDTO draft) {
    List<String> errors = new ArrayList<>();
    String prompt = draft.getPromptText();
    if (prompt == null || prompt.isBlank()) {
      errors.add("Thiếu câu có chỗ trống");
      return errors;
    }
    int placeholderCount = countBlanks(prompt);
    if (placeholderCount < 1) {
      errors.add("FILL_BLANK cần ít nhất một dấu ___");
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
      JsonNode blank = blanks.get(i);
      if (!blank.has("acceptedAnswers") || !blank.get("acceptedAnswers").isArray()
          || blank.get("acceptedAnswers").isEmpty()) {
        errors.add("Ô trống " + (i + 1) + ": thiếu acceptedAnswers");
        continue;
      }
      boolean hasAnswer = false;
      for (JsonNode ans : blank.get("acceptedAnswers")) {
        if (ans.isTextual() && !ans.asText().isBlank()) {
          hasAnswer = true;
          break;
        }
      }
      if (!hasAnswer) {
        errors.add("Ô trống " + (i + 1) + ": cần ít nhất một đáp án");
      }
    }
    return errors;
  }

  private int countBlanks(String promptText) {
    Matcher matcher = BLANK_RUN_RE.matcher(promptText);
    int count = 0;
    while (matcher.find()) {
      count++;
    }
    return count;
  }

  /** Collapse ____ / ______ … into canonical "___" (one slot per underscore run). */
  private String normalizeBlankRuns(String promptText) {
    return BLANK_RUN_RE.matcher(promptText).replaceAll("___");
  }
}
