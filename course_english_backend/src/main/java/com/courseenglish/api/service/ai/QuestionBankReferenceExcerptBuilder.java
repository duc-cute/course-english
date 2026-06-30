package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.response.ResQuestionChoiceDTO;
import com.courseenglish.api.domain.response.ResQuestionDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class QuestionBankReferenceExcerptBuilder {

  private static final int MAX_EXCERPT_CHARS = 24_000;

  private static final Set<String> REDACT_FIELD_NAMES =
      Set.of(
          "correctChoiceId",
          "correctAnswer",
          "correctOrder",
          "correct",
          "isCorrect",
          "answerKey",
          "explanation");

  private final ObjectMapper objectMapper;

  public QuestionBankReferenceExcerptBuilder(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  /** Structure-only excerpt for Generate Similar (answers redacted). */
  public String buildSimilarExcerpt(ResQuestionDTO question) {
    return buildExcerpt(question, true);
  }

  /** Full excerpt for Rewrite / Simplify / Increase difficulty. */
  public String buildRewriteExcerpt(ResQuestionDTO question) {
    return buildExcerpt(question, false);
  }

  private String buildExcerpt(ResQuestionDTO question, boolean redactAnswers) {
    if (question == null) {
      throw new IllegalArgumentException("Question không hợp lệ");
    }
    StringBuilder sb = new StringBuilder();
    sb.append("QUESTION BANK REFERENCE\n");
    if (question.getId() != null) {
      sb.append("Source question ID: ").append(question.getId()).append('\n');
    }
    if (question.getQuestionType() != null) {
      sb.append("Question type: ").append(question.getQuestionType().name()).append('\n');
    }
    if (question.getDifficulty() != null) {
      sb.append("Difficulty (1-5): ").append(question.getDifficulty()).append('\n');
    }
    if (question.getPromptLang() != null && !question.getPromptLang().isBlank()) {
      sb.append("promptLang: ").append(question.getPromptLang().trim()).append('\n');
    }
    if (question.getTopic() != null && !question.getTopic().isBlank()) {
      sb.append("Topic: ").append(question.getTopic().trim()).append('\n');
    }
    if (question.getSkill() != null && !question.getSkill().isBlank()) {
      sb.append("Skill: ").append(question.getSkill().trim()).append('\n');
    }
    if (question.getCefrLevel() != null && !question.getCefrLevel().isBlank()) {
      sb.append("CEFR: ").append(question.getCefrLevel().trim()).append('\n');
    }
    if (question.getTitle() != null && !question.getTitle().isBlank()) {
      sb.append("Title: ").append(question.getTitle().trim()).append('\n');
    }
    sb.append('\n');
    if (question.getPromptText() != null && !question.getPromptText().isBlank()) {
      sb.append("Stem (promptText):\n").append(question.getPromptText().trim()).append("\n\n");
    }
    List<ResQuestionChoiceDTO> choices = question.getChoices();
    if (choices != null && !choices.isEmpty()) {
      sb.append(redactAnswers ? "Choices (correct answer hidden):\n" : "Choices:\n");
      for (ResQuestionChoiceDTO c : choices) {
        if (c == null) continue;
        String key = c.getChoiceKey() != null ? c.getChoiceKey() : "?";
        String text = c.getChoiceText() != null ? c.getChoiceText() : "";
        if (redactAnswers) {
          sb.append(key).append(". ").append(text).append('\n');
        } else {
          sb.append(key).append(". ").append(text);
          if (c.isCorrect()) {
            sb.append(" [CORRECT]");
          }
          sb.append('\n');
        }
      }
      sb.append('\n');
    }
    if (!redactAnswers && question.getExplanation() != null && !question.getExplanation().isBlank()) {
      sb.append("Explanation:\n").append(question.getExplanation().trim()).append("\n\n");
    }
    if (question.getContentJson() != null && !question.getContentJson().isBlank()) {
      sb.append(redactAnswers ? "contentJson (structure only — answers redacted):\n" : "contentJson:\n");
      sb.append(formatContentJson(question.getContentJson(), redactAnswers)).append('\n');
    }
    String text = sb.toString().trim();
    if (text.length() > MAX_EXCERPT_CHARS) {
      return text.substring(0, MAX_EXCERPT_CHARS) + "\n…[truncated]";
    }
    return text;
  }

  private String formatContentJson(String contentJson, boolean redact) {
    try {
      JsonNode root = objectMapper.readTree(contentJson);
      if (redact && root.isObject()) {
        return objectMapper
            .writerWithDefaultPrettyPrinter()
            .writeValueAsString(redactNode(root.deepCopy()));
      }
      return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(root);
    } catch (Exception e) {
      return contentJson;
    }
  }

  private JsonNode redactNode(JsonNode node) {
    if (node == null || node.isNull()) {
      return node;
    }
    if (node.isObject()) {
      ObjectNode obj = (ObjectNode) node;
      Iterator<Map.Entry<String, JsonNode>> fields = obj.fields();
      while (fields.hasNext()) {
        Map.Entry<String, JsonNode> entry = fields.next();
        String name = entry.getKey();
        if (REDACT_FIELD_NAMES.contains(name)) {
          obj.put(name, "[redacted]");
        } else {
          obj.set(name, redactNode(entry.getValue()));
        }
      }
      return obj;
    }
    if (node.isArray()) {
      for (int i = 0; i < node.size(); i++) {
        ((com.fasterxml.jackson.databind.node.ArrayNode) node).set(i, redactNode(node.get(i)));
      }
    }
    return node;
  }
}
