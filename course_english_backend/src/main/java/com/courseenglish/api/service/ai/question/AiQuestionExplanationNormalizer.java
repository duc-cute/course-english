package com.courseenglish.api.service.ai.question;

import com.courseenglish.api.service.ai.question.dto.AiDraftChoiceDTO;
import com.courseenglish.api.service.ai.question.dto.AiDraftQuestionDTO;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Repairs weak/truncated explanations (often caused by unescaped quotes in AI JSON) by
 * synthesizing a short Vietnamese fallback from the correct answer.
 */
@Component
public class AiQuestionExplanationNormalizer {

  private static final int MIN_GOOD_LENGTH = 28;
  private static final Pattern TRUNCATED_VI =
      Pattern.compile("(?i)(đáp án đúng là|nên chọn|chọn)\\s*[\"'«»]?\\s*$");

  public void normalize(AiDraftQuestionDTO draft) {
    if (draft == null) {
      return;
    }
    draft.setExplanation(enrichTopLevel(draft));
    enrichReadingSubQuestions(draft);
  }

  private String enrichTopLevel(AiDraftQuestionDTO draft) {
    String current = draft.getExplanation();
    if (!isWeak(current)) {
      return current;
    }
    return buildFallback(draft);
  }

  private void enrichReadingSubQuestions(AiDraftQuestionDTO draft) {
    if (draft.getQuestionType() != QuestionTypeEnum.READING_COMPREHENSION) {
      return;
    }
    JsonNode root = draft.getContentJson();
    if (root == null || !root.isObject() || !root.has("subQuestions") || !root.get("subQuestions").isArray()) {
      return;
    }
    ArrayNode subs = (ArrayNode) root.get("subQuestions");
    for (int i = 0; i < subs.size(); i++) {
      JsonNode sub = subs.get(i);
      if (!sub.isObject()) {
        continue;
      }
      ObjectNode subObj = (ObjectNode) sub;
      String exp = subObj.path("explanation").asText("");
      if (!isWeak(exp)) {
        continue;
      }
      String correctText = findCorrectChoiceText(subObj);
      if (correctText != null) {
        subObj.put("explanation", buildMcqStyleFallback(correctText, subObj.path("promptText").asText("")));
      }
    }
  }

  private static boolean isWeak(String explanation) {
    if (explanation == null || explanation.isBlank()) {
      return true;
    }
    String trimmed = explanation.trim();
    if (trimmed.length() < MIN_GOOD_LENGTH) {
      return true;
    }
    return TRUNCATED_VI.matcher(trimmed).find();
  }

  private static String buildFallback(AiDraftQuestionDTO draft) {
    QuestionTypeEnum type = draft.getQuestionType();
    if (type == QuestionTypeEnum.MULTIPLE_CHOICE) {
      String correct = findCorrectChoiceText(draft.getChoices());
      if (correct != null) {
        return buildMcqStyleFallback(correct, draft.getPromptText());
      }
    }
    if (type == QuestionTypeEnum.TRUE_FALSE) {
      JsonNode node = draft.getContentJson();
      if (node != null && node.has("correctAnswer") && node.get("correctAnswer").isBoolean()) {
        boolean correct = node.get("correctAnswer").asBoolean();
        return correct
            ? "Câu này đúng với nội dung câu hỏi — chọn Đúng (True)."
            : "Câu này không đúng với nội dung câu hỏi — chọn Sai (False).";
      }
    }
    if (type == QuestionTypeEnum.FILL_BLANK) {
      List<String> answers = collectFillBlankAnswers(draft.getContentJson());
      if (!answers.isEmpty()) {
        return "Điền «"
            + String.join("» hoặc «", answers)
            + "» vì đây là đáp án phù hợp với ngữ cảnh và ngữ pháp của câu.";
      }
    }
    return "Đáp án đúng phù hợp với ngữ cảnh và quy tắc ngữ pháp của câu hỏi.";
  }

  private static String buildMcqStyleFallback(String correctText, String promptText) {
    String answer = correctText.trim();
    String stemHint =
        promptText != null && promptText.length() > 12
            ? " Dựa trên nội dung câu hỏi,"
            : "";
    return "Đáp án đúng là «"
        + answer
        + "»."
        + stemHint
        + " các phương án còn lại không phù hợp với ngữ cảnh hoặc ngữ pháp.";
  }

  private static String findCorrectChoiceText(ObjectNode subObj) {
    if (!subObj.has("choices") || !subObj.get("choices").isArray()) {
      return null;
    }
    List<AiDraftChoiceDTO> choices = new ArrayList<>();
    for (JsonNode c : subObj.get("choices")) {
      AiDraftChoiceDTO dto = new AiDraftChoiceDTO();
      dto.setChoiceText(c.path("choiceText").asText(""));
      dto.setCorrect(c.path("correct").asBoolean(false));
      choices.add(dto);
    }
    return findCorrectChoiceText(choices);
  }

  private static String findCorrectChoiceText(List<AiDraftChoiceDTO> choices) {
    if (choices == null) {
      return null;
    }
    for (AiDraftChoiceDTO c : choices) {
      if (Boolean.TRUE.equals(c.getCorrect()) && c.getChoiceText() != null && !c.getChoiceText().isBlank()) {
        return c.getChoiceText().trim();
      }
    }
    return null;
  }

  private static List<String> collectFillBlankAnswers(JsonNode contentJson) {
    List<String> out = new ArrayList<>();
    if (contentJson == null || !contentJson.has("blanks") || !contentJson.get("blanks").isArray()) {
      return out;
    }
    for (JsonNode blank : contentJson.get("blanks")) {
      JsonNode accepted = blank.path("acceptedAnswers");
      if (accepted.isArray() && accepted.size() > 0) {
        String first = accepted.get(0).asText("").trim();
        if (!first.isEmpty()) {
          out.add(first);
        }
      }
    }
    return out;
  }
}
