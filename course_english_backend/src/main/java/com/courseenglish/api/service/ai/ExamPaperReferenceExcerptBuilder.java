package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.response.ResExamSectionDTO;
import com.courseenglish.api.service.ExamSectionPayloadValidator;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import java.util.Iterator;
import java.util.Map;
import java.util.Set;

@Component
public class ExamPaperReferenceExcerptBuilder {

  private static final int MAX_EXCERPT_CHARS = 28_000;

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
  private final ExamSectionPayloadValidator payloadValidator;

  public ExamPaperReferenceExcerptBuilder(
      ObjectMapper objectMapper, ExamSectionPayloadValidator payloadValidator) {
    this.objectMapper = objectMapper;
    this.payloadValidator = payloadValidator;
  }

  public int resolveGenQuestionCount(QuestionTypeEnum type, String payloadJson) {
    if (payloadJson == null || payloadJson.isBlank()) {
      return 0;
    }
    int topLevel = payloadValidator.countQuestions(payloadJson);
    if (topLevel == 0) {
      return 0;
    }
    if (type == QuestionTypeEnum.READING_COMPREHENSION) {
      ReadingGenCounts counts = resolveReadingCounts(payloadJson);
      return counts.passageCount() > 1 ? counts.passageCount() : counts.subQuestionCount();
    }
    if (type == QuestionTypeEnum.GAP_FILL_MCQ) {
      try {
        JsonNode root = objectMapper.readTree(payloadJson);
        JsonNode first = root.path("questions").get(0);
        if (first != null && !first.isNull()) {
          JsonNode blanks = unwrapContentJson(first).path("blanks");
          if (blanks.isArray() && !blanks.isEmpty()) {
            return blanks.size();
          }
        }
      } catch (Exception ignored) {
        // fall through
      }
    }
    return topLevel;
  }

  /** Passage count and sub-questions per passage for READING sections. */
  public ReadingGenCounts resolveReadingCounts(String payloadJson) {
    int topLevel = payloadValidator.countQuestions(payloadJson);
    if (topLevel == 0) {
      return new ReadingGenCounts(0, 0);
    }
    try {
      JsonNode root = objectMapper.readTree(payloadJson);
      JsonNode first = root.path("questions").get(0);
      int subs = 4;
      if (first != null && !first.isNull()) {
        JsonNode subArr = unwrapContentJson(first).path("subQuestions");
        if (subArr.isArray() && !subArr.isEmpty()) {
          subs = subArr.size();
        }
      }
      if (topLevel > 1) {
        return new ReadingGenCounts(topLevel, subs);
      }
      return new ReadingGenCounts(1, subs > 0 ? subs : topLevel);
    } catch (Exception ignored) {
      return new ReadingGenCounts(1, topLevel);
    }
  }

  public record ReadingGenCounts(int passageCount, int subQuestionCount) {}

  public String buildReferenceExcerpt(ResExamSectionDTO section) throws IllegalArgumentException {
    if (section.getPayloadJson() == null || section.getPayloadJson().isBlank()) {
      throw new IllegalArgumentException("Section không có payloadJson");
    }
    try {
      JsonNode root = objectMapper.readTree(section.getPayloadJson());
      if (!root.isObject()) {
        throw new IllegalArgumentException("payloadJson không hợp lệ");
      }
      ObjectNode redacted = redactNode(root.deepCopy());
      StringBuilder sb = new StringBuilder();
      if (section.getTitle() != null && !section.getTitle().isBlank()) {
        sb.append("Section title: ").append(section.getTitle().trim()).append('\n');
      }
      if (section.getInstruction() != null && !section.getInstruction().isBlank()) {
        sb.append("Student instruction: ").append(section.getInstruction().trim()).append('\n');
      }
      if (section.getQuestionType() != null) {
        sb.append("Question type: ").append(section.getQuestionType().name()).append('\n');
      }
      sb.append("\nReference items (correct answers removed — structure only):\n");
      sb.append(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(redacted));
      String text = sb.toString();
      if (text.length() > MAX_EXCERPT_CHARS) {
        return text.substring(0, MAX_EXCERPT_CHARS) + "\n…[truncated]";
      }
      return text;
    } catch (IllegalArgumentException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new IllegalArgumentException("Không đọc được payloadJson section: " + ex.getMessage());
    }
  }

  private ObjectNode redactNode(ObjectNode node) {
    Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
    while (fields.hasNext()) {
      Map.Entry<String, JsonNode> entry = fields.next();
      String key = entry.getKey();
      JsonNode value = entry.getValue();
      if (REDACT_FIELD_NAMES.contains(key)) {
        fields.remove();
        continue;
      }
      if ("contentJson".equals(key) && value.isTextual()) {
        try {
          JsonNode parsed = objectMapper.readTree(value.asText());
          if (parsed.isObject()) {
            node.set(key, redactNode((ObjectNode) parsed.deepCopy()));
          }
        } catch (Exception ignored) {
          // keep as-is
        }
      } else if (value.isObject()) {
        node.set(key, redactNode((ObjectNode) value));
      } else if (value.isArray()) {
        node.set(key, redactArray((ArrayNode) value));
      }
    }
    return node;
  }

  private ArrayNode redactArray(ArrayNode array) {
    for (int i = 0; i < array.size(); i++) {
      JsonNode item = array.get(i);
      if (item.isObject()) {
        array.set(i, redactNode((ObjectNode) item.deepCopy()));
      } else if (item.isArray()) {
        array.set(i, redactArray((ArrayNode) item));
      }
    }
    return array;
  }

  private JsonNode unwrapContentJson(JsonNode question) {
    JsonNode content = question.get("contentJson");
    if (content == null || content.isNull()) {
      return objectMapper.createObjectNode();
    }
    if (content.isObject()) {
      return content;
    }
    if (content.isTextual()) {
      try {
        return objectMapper.readTree(content.asText());
      } catch (Exception ignored) {
        return objectMapper.createObjectNode();
      }
    }
    return objectMapper.createObjectNode();
  }
}
