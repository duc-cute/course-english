package com.courseenglish.api.service.exam;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * Server-side scoring for exam attempts — uses original section payloads (not redacted).
 * Accepts FE answer snapshot shape: { answers: { questionId: { selectedChoiceId, ... } } }
 * or flat { questionId: {...} }.
 *
 * <p>Exercise JSON uses {@code correctChoiceId} on MCQ / gap blanks / reading subs (not
 * {@code correct: true} on each choice). Both shapes are supported.
 */
@Component
public class ExamAttemptScoringService {

  public record ScoreResult(int correctUnits, int totalUnits, int scorePercent, boolean passed) {}

  private final ObjectMapper objectMapper;

  public ExamAttemptScoringService(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public ScoreResult score(List<String> payloadJsons, Object answersPayload, int passScorePercent) {
    Map<String, JsonNode> questionsById = indexQuestions(payloadJsons);
    Map<String, JsonNode> answers = extractAnswers(answersPayload);

    int correctUnits = 0;
    int totalUnits = 0;

    for (Map.Entry<String, JsonNode> entry : questionsById.entrySet()) {
      String qid = entry.getKey();
      JsonNode question = entry.getValue();
      JsonNode answer = answers.get(qid);
      int units = scoringUnits(question);
      totalUnits += units;
      correctUnits += correctUnitsFor(question, answer);
    }

    int scorePercent = totalUnits > 0 ? (int) Math.round((correctUnits * 100.0) / totalUnits) : 0;
    boolean passed = scorePercent >= passScorePercent;
    return new ScoreResult(correctUnits, totalUnits, scorePercent, passed);
  }

  private Map<String, JsonNode> indexQuestions(List<String> payloadJsons) {
    Map<String, JsonNode> map = new HashMap<>();
    if (payloadJsons == null) {
      return map;
    }
    for (String payload : payloadJsons) {
      if (payload == null || payload.isBlank()) {
        continue;
      }
      try {
        JsonNode root = objectMapper.readTree(payload);
        JsonNode questions = root.get("questions");
        if (questions == null || !questions.isArray()) {
          continue;
        }
        for (JsonNode q : questions) {
          String id = text(q, "id");
          if (id != null) {
            map.put(id, q);
          }
        }
      } catch (Exception ignored) {
        // skip bad payload
      }
    }
    return map;
  }

  private Map<String, JsonNode> extractAnswers(Object answersPayload) {
    Map<String, JsonNode> map = new HashMap<>();
    if (answersPayload == null) {
      return map;
    }
    try {
      JsonNode root = objectMapper.valueToTree(answersPayload);
      JsonNode answersNode = root.has("answers") ? root.get("answers") : root;
      if (answersNode == null || !answersNode.isObject()) {
        return map;
      }
      Iterator<Map.Entry<String, JsonNode>> fields = answersNode.fields();
      while (fields.hasNext()) {
        Map.Entry<String, JsonNode> e = fields.next();
        map.put(e.getKey(), e.getValue());
      }
    } catch (Exception ignored) {
      // empty
    }
    return map;
  }

  private int scoringUnits(JsonNode question) {
    String type = text(question, "type");
    if ("GAP_FILL_MCQ".equals(type)) {
      JsonNode blanks = blanksNode(question);
      return blanks != null && blanks.isArray() ? Math.max(1, blanks.size()) : 1;
    }
    if ("READING_COMPREHENSION".equals(type)) {
      JsonNode subs = subQuestionsNode(question);
      return subs != null && subs.isArray() ? Math.max(1, subs.size()) : 1;
    }
    return 1;
  }

  private int correctUnitsFor(JsonNode question, JsonNode answer) {
    if (answer == null || answer.isNull()) {
      return 0;
    }
    String type = text(question, "type");
    if (type == null) {
      type = "";
    }
    return switch (type) {
      case "MULTIPLE_CHOICE", "LISTEN_CHOOSE" -> scoreChoice(question, answer) ? 1 : 0;
      case "TRUE_FALSE" -> scoreTrueFalse(question, answer) ? 1 : 0;
      case "SPELLING", "LISTEN_TYPE" -> scoreTyped(question, answer) ? 1 : 0;
      case "FILL_BLANK" -> scoreFillBlank(question, answer) ? 1 : 0;
      case "GAP_FILL_MCQ" -> scoreGapFillMcq(question, answer);
      case "READING_COMPREHENSION" -> scoreReading(question, answer);
      case "REORDER_SENTENCE" -> scoreReorder(question, answer) ? 1 : 0;
      case "MATCHING" -> scoreMatching(question, answer) ? 1 : 0;
      default -> answer.path("correct").asBoolean(false) ? 1 : 0;
    };
  }

  private boolean scoreChoice(JsonNode question, JsonNode answer) {
    String selected = text(answer, "selectedChoiceId");
    if (selected == null) {
      return false;
    }
    String correctChoiceId = text(question, "correctChoiceId");
    if (correctChoiceId != null) {
      return selected.equalsIgnoreCase(correctChoiceId);
    }
    JsonNode choices = choicesNode(question);
    if (choices == null) {
      return false;
    }
    for (JsonNode c : choices) {
      if (isMarkedCorrectChoice(c) && selected.equalsIgnoreCase(text(c, "id"))) {
        return true;
      }
    }
    return false;
  }

  private boolean scoreTrueFalse(JsonNode question, JsonNode answer) {
    if (scoreChoice(question, answer)) {
      return true;
    }
    // TRUE_FALSE exercise shape: correctAnswer boolean + selectedChoiceId "true"/"false"
    if (question.has("correctAnswer") && question.get("correctAnswer").isBoolean()) {
      String selected = text(answer, "selectedChoiceId");
      if (selected == null) {
        return false;
      }
      boolean expected = question.get("correctAnswer").asBoolean();
      return expected
          ? selected.equalsIgnoreCase("true") || selected.equalsIgnoreCase("t")
          : selected.equalsIgnoreCase("false") || selected.equalsIgnoreCase("f");
    }
    return false;
  }

  private boolean scoreTyped(JsonNode question, JsonNode answer) {
    String typed = text(answer, "typedAnswer");
    String expected = text(question, "correctAnswer");
    if (typed == null || expected == null) {
      return false;
    }
    boolean caseSensitive = question.path("caseSensitive").asBoolean(false);
    return caseSensitive ? typed.equals(expected) : typed.equalsIgnoreCase(expected);
  }

  private boolean scoreFillBlank(JsonNode question, JsonNode answer) {
    JsonNode blanks = blanksNode(question);
    JsonNode given = answer.get("fillBlankAnswers");
    if (blanks == null || !blanks.isArray() || given == null || !given.isObject()) {
      return false;
    }
    boolean caseSensitive = question.path("caseSensitive").asBoolean(false);
    for (JsonNode blank : blanks) {
      String blankId = text(blank, "id");
      if (blankId == null) {
        return false;
      }
      String user = given.path(blankId).asText("").trim();
      if (!matchesAccepted(user, blank.get("acceptedAnswers"), caseSensitive)) {
        return false;
      }
    }
    return true;
  }

  private int scoreGapFillMcq(JsonNode question, JsonNode answer) {
    JsonNode blanks = blanksNode(question);
    JsonNode given = answer.get("gapFillMcqAnswers");
    if (blanks == null || !blanks.isArray()) {
      return 0;
    }
    int correct = 0;
    for (JsonNode blank : blanks) {
      String blankId = text(blank, "id");
      String selected = given != null && blankId != null ? text(given, blankId) : null;
      if (selected == null) {
        continue;
      }
      if (isSelectedCorrectForMcqNode(blank, selected)) {
        correct++;
      }
    }
    return correct;
  }

  private int scoreReading(JsonNode question, JsonNode answer) {
    JsonNode subs = subQuestionsNode(question);
    JsonNode given = answer.get("readingSubAnswers");
    if (subs == null || !subs.isArray()) {
      return 0;
    }
    int correct = 0;
    for (JsonNode sub : subs) {
      String subId = text(sub, "id");
      String selected = given != null && subId != null ? text(given, subId) : null;
      if (selected == null) {
        continue;
      }
      if (isSelectedCorrectForMcqNode(sub, selected)) {
        correct++;
      }
    }
    return correct;
  }

  /** Prefer correctChoiceId; fall back to choice.correct flags. */
  private boolean isSelectedCorrectForMcqNode(JsonNode node, String selected) {
    String correctChoiceId = text(node, "correctChoiceId");
    if (correctChoiceId != null) {
      return selected.equalsIgnoreCase(correctChoiceId);
    }
    JsonNode choices = node.get("choices");
    if (choices == null || !choices.isArray()) {
      return false;
    }
    for (JsonNode c : choices) {
      if (isMarkedCorrectChoice(c) && selected.equalsIgnoreCase(text(c, "id"))) {
        return true;
      }
    }
    return false;
  }

  private boolean isMarkedCorrectChoice(JsonNode choice) {
    if (choice == null) {
      return false;
    }
    if (choice.path("correct").asBoolean(false)) {
      return true;
    }
    // legacy / import variants
    return choice.path("isCorrect").asBoolean(false);
  }

  private boolean scoreReorder(JsonNode question, JsonNode answer) {
    JsonNode order = answer.get("reorderTokenIds");
    if (order == null || !order.isArray()) {
      order = answer.get("reorderTokenOrder");
    }
    JsonNode tokens = question.get("tokens");
    if (order == null || !order.isArray() || tokens == null || !tokens.isArray()) {
      return answer.path("correct").asBoolean(false);
    }
    java.util.List<String> expected = new java.util.ArrayList<>();
    for (int i = 0; i < tokens.size(); i++) {
      for (JsonNode t : tokens) {
        if (t.path("correctOrder").asInt(-1) == i) {
          String id = text(t, "id");
          if (id != null) {
            expected.add(id);
          }
        }
      }
    }
    if (expected.isEmpty()) {
      return answer.path("correct").asBoolean(false);
    }
    if (order.size() != expected.size()) {
      return false;
    }
    for (int i = 0; i < expected.size(); i++) {
      if (!expected.get(i).equals(order.get(i).asText())) {
        return false;
      }
    }
    return true;
  }

  private boolean scoreMatching(JsonNode question, JsonNode answer) {
    return answer.path("correct").asBoolean(false);
  }

  private boolean matchesAccepted(String user, JsonNode accepted, boolean caseSensitive) {
    if (accepted == null || !accepted.isArray() || accepted.isEmpty()) {
      return false;
    }
    for (JsonNode a : accepted) {
      String exp = a.asText("").trim();
      if (caseSensitive ? user.equals(exp) : user.equalsIgnoreCase(exp)) {
        return true;
      }
    }
    return false;
  }

  private JsonNode choicesNode(JsonNode question) {
    if (question.has("choices")) {
      return question.get("choices");
    }
    JsonNode content = question.get("contentJson");
    return content != null ? content.get("choices") : null;
  }

  private JsonNode blanksNode(JsonNode question) {
    if (question.has("blanks")) {
      return question.get("blanks");
    }
    JsonNode content = question.get("contentJson");
    return content != null ? content.get("blanks") : null;
  }

  private JsonNode subQuestionsNode(JsonNode question) {
    if (question.has("subQuestions")) {
      return question.get("subQuestions");
    }
    JsonNode content = question.get("contentJson");
    return content != null ? content.get("subQuestions") : null;
  }

  private String text(JsonNode node, String field) {
    if (node == null || !node.has(field) || node.get(field).isNull()) {
      return null;
    }
    String v = node.get(field).asText("").trim();
    return v.isEmpty() ? null : v;
  }
}
