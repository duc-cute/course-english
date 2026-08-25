package com.courseenglish.api.service.ai.question.impl;

import com.courseenglish.api.service.ai.question.AiQuestionTypeHandler;
import com.courseenglish.api.service.ai.question.dto.AiDraftChoiceDTO;
import com.courseenglish.api.service.ai.question.dto.AiDraftQuestionDTO;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class McqQuestionTypeHandler implements AiQuestionTypeHandler {

  private static final String[] KEYS = {"a", "b", "c", "d", "e", "f"};
  private static final String LAYOUT_SENTENCE_ARRANGEMENT = "SENTENCE_ARRANGEMENT";
  private static final Pattern ITEM_LABEL_RE =
      Pattern.compile("(?:^|[\\n\\r])\\s*([a-e])\\.\\s+", Pattern.CASE_INSENSITIVE);
  private static final Pattern INLINE_ITEM_LABEL_RE =
      Pattern.compile("\\s+([a-e])\\.\\s+", Pattern.CASE_INSENSITIVE);

  private final ObjectMapper objectMapper;

  public McqQuestionTypeHandler(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public QuestionTypeEnum supportedType() {
    return QuestionTypeEnum.MULTIPLE_CHOICE;
  }

  @Override
  public String promptSchemaFragment() {
    return """
        MULTIPLE_CHOICE:
        - choices: array of 4 items with choiceText and correct (boolean)
        - Exactly one choice has correct: true
        - Standard MCQ: put the full stem in promptText; do NOT use contentJson
        - Sentence Arrangement (THPT — pick order A–D):
          - promptText = short instruction/stem ONLY (no a./b./c. lines)
          - contentJson: {
              "layout": "SENTENCE_ARRANGEMENT",
              "items": [ { "key": "a", "text": "..." }, ... at least 3, usually a–e ]
            }
          - choices: permutation strings like "d – e – b – c – a" (use en-dash or hyphen)
          - NEVER dump a./b./c. sentences into promptText when using this layout
        """;
  }

  @Override
  public String promptExampleJson() {
    return """
        {
          "questionType": "MULTIPLE_CHOICE",
          "promptText": "She ___ to school every day.",
          "explanation": "Chủ ngữ She (ngôi thứ ba số ít) đi với động từ thêm -s/es ở thì hiện tại đơn, nên đáp án đúng là «goes».",
          "choices": [
            { "choiceText": "go", "correct": false },
            { "choiceText": "goes", "correct": true },
            { "choiceText": "going", "correct": false },
            { "choiceText": "went", "correct": false }
          ]
        }""";
  }

  @Override
  public void normalize(AiDraftQuestionDTO draft) {
    if (draft.getChoices() == null) {
      draft.setChoices(new ArrayList<>());
    }
    for (int i = 0; i < draft.getChoices().size(); i++) {
      AiDraftChoiceDTO choice = draft.getChoices().get(i);
      if (choice.getChoiceKey() == null || choice.getChoiceKey().isBlank()) {
        choice.setChoiceKey(i < KEYS.length ? KEYS[i] : "x" + (i + 1));
      } else {
        choice.setChoiceKey(choice.getChoiceKey().trim().toLowerCase(Locale.ROOT));
      }
      if (choice.getDisplayOrder() == null) {
        choice.setDisplayOrder(i);
      }
    }

    if (normalizeArrangementContent(draft)) {
      return;
    }
    draft.setContentJson(null);
  }

  @Override
  public List<String> validate(AiDraftQuestionDTO draft) {
    List<String> errors = new ArrayList<>();
    if (draft.getPromptText() == null || draft.getPromptText().isBlank()) {
      errors.add("Thiếu nội dung câu hỏi");
      return errors;
    }
    List<AiDraftChoiceDTO> choices = draft.getChoices();
    if (choices == null || choices.size() < 2) {
      errors.add("MCQ cần ít nhất 2 đáp án");
      return errors;
    }
    Set<String> keys = new HashSet<>();
    int correctCount = 0;
    for (int i = 0; i < choices.size(); i++) {
      AiDraftChoiceDTO c = choices.get(i);
      if (c.getChoiceKey() == null || c.getChoiceKey().isBlank()) {
        errors.add("Đáp án " + (i + 1) + ": thiếu mã");
        continue;
      }
      if (c.getChoiceText() == null || c.getChoiceText().isBlank()) {
        errors.add("Đáp án " + c.getChoiceKey() + ": thiếu nội dung");
      }
      if (!keys.add(c.getChoiceKey())) {
        errors.add("Mã đáp án \"" + c.getChoiceKey() + "\" bị trùng");
      }
      if (Boolean.TRUE.equals(c.getCorrect())) {
        correctCount++;
      }
    }
    if (correctCount != 1) {
      errors.add("MCQ cần đúng 1 đáp án đúng");
    }

    JsonNode content = draft.getContentJson();
    if (content != null && content.isObject() && content.has("items")) {
      JsonNode items = content.get("items");
      if (!items.isArray() || items.size() < 3) {
        errors.add("Sentence Arrangement cần contentJson.items (≥ 3 câu)");
      } else {
        for (int i = 0; i < items.size(); i++) {
          JsonNode item = items.get(i);
          if (item == null || !item.isObject()) {
            errors.add("items[" + i + "] không hợp lệ");
            continue;
          }
          if (item.path("key").asText("").isBlank() || item.path("text").asText("").isBlank()) {
            errors.add("items[" + i + "]: thiếu key hoặc text");
          }
        }
      }
    }
    return errors;
  }

  private boolean normalizeArrangementContent(AiDraftQuestionDTO draft) {
    List<Item> fromContent = readItems(draft.getContentJson());
    if (fromContent.size() >= 3) {
      writeArrangement(draft, draft.getPromptText(), fromContent);
      return true;
    }

    String prompt = draft.getPromptText() == null ? "" : draft.getPromptText();
    if (!looksLikeArrangement(prompt, draft.getChoices())) {
      return false;
    }
    List<Item> extracted = extractItems(prompt);
    if (extracted.size() < 3) {
      return false;
    }
    writeArrangement(draft, extractStem(prompt), extracted);
    return true;
  }

  private void writeArrangement(AiDraftQuestionDTO draft, String stem, List<Item> items) {
    if (stem != null) {
      draft.setPromptText(stem.trim());
    }
    ObjectNode root = objectMapper.createObjectNode();
    root.put("layout", LAYOUT_SENTENCE_ARRANGEMENT);
    ArrayNode arr = root.putArray("items");
    for (Item item : items) {
      ObjectNode row = arr.addObject();
      row.put("key", item.key());
      row.put("text", item.text());
    }
    draft.setContentJson(root);
  }

  private static List<Item> readItems(JsonNode content) {
    List<Item> items = new ArrayList<>();
    if (content == null || !content.isObject() || !content.has("items") || !content.get("items").isArray()) {
      return items;
    }
    for (JsonNode node : content.get("items")) {
      if (node == null || !node.isObject()) {
        continue;
      }
      String key = node.path("key").asText("").trim().toLowerCase(Locale.ROOT);
      String text = node.path("text").asText("").trim();
      if (key.isBlank() || text.isBlank()) {
        continue;
      }
      if (isPermutationChoice(text)) {
        break;
      }
      items.add(new Item(key, stripTrailingChoiceBlock(text)));
    }
    return items.stream().filter(item -> !item.text().isBlank() && !isPermutationChoice(item.text())).toList();
  }

  private static boolean looksLikeArrangement(String prompt, List<AiDraftChoiceDTO> choices) {
    if (choices == null) {
      return false;
    }
    int permutationCount = 0;
    for (AiDraftChoiceDTO choice : choices) {
      if (choice.getChoiceText() != null && isPermutationChoice(choice.getChoiceText())) {
        permutationCount++;
      }
    }
    if (permutationCount < 2) {
      return false;
    }
    return extractItems(prompt).size() >= 3;
  }

  private static boolean isPermutationChoice(String text) {
    String normalized =
        text.trim()
            .replaceAll("\\s+", " ")
            .replace('–', '-')
            .replace('—', '-')
            .replace(',', '-')
            .replaceAll("\\s*-\\s*", "-");
    return normalized.matches("(?i)^[a-e](-[a-e]){2,}$");
  }

  private static List<Item> extractItems(String promptText) {
    String normalized = promptText.replace("\r\n", "\n").trim();
    if (normalized.isBlank()) {
      return List.of();
    }
    Matcher matcher = ITEM_LABEL_RE.matcher(normalized);
    List<int[]> starts = new ArrayList<>();
    List<String> keys = new ArrayList<>();
    while (matcher.find()) {
      keys.add(matcher.group(1).toLowerCase(Locale.ROOT));
      starts.add(new int[] {matcher.start(), matcher.end()});
    }
    if (starts.size() < 3) {
      return extractInlineItems(normalized);
    }
    List<Item> items = new ArrayList<>();
    for (int i = 0; i < starts.size(); i++) {
      int contentStart = starts.get(i)[1];
      int end = i + 1 < starts.size() ? starts.get(i + 1)[0] : normalized.length();
      String text = stripTrailingChoiceBlock(normalized.substring(contentStart, end).trim());
      if (isPermutationChoice(text)) {
        break;
      }
      if (!text.isBlank()) {
        items.add(new Item(keys.get(i), text));
      }
    }
    return items;
  }

  private static List<Item> extractInlineItems(String text) {
    List<int[]> starts = new ArrayList<>();
    List<String> keys = new ArrayList<>();
    Matcher first = Pattern.compile("^([a-e])\\.\\s+", Pattern.CASE_INSENSITIVE).matcher(text);
    if (first.find()) {
      keys.add(first.group(1).toLowerCase(Locale.ROOT));
      starts.add(new int[] {0, first.end()});
    }
    Matcher matcher = INLINE_ITEM_LABEL_RE.matcher(text);
    while (matcher.find()) {
      keys.add(matcher.group(1).toLowerCase(Locale.ROOT));
      starts.add(new int[] {matcher.start(), matcher.end()});
    }
    if (starts.size() < 3) {
      return List.of();
    }
    List<Item> items = new ArrayList<>();
    for (int i = 0; i < starts.size(); i++) {
      int contentStart = starts.get(i)[1];
      int end = i + 1 < starts.size() ? starts.get(i + 1)[0] : text.length();
      String body = stripTrailingChoiceBlock(text.substring(contentStart, end).trim());
      if (isPermutationChoice(body)) {
        break;
      }
      if (!body.isBlank()) {
        items.add(new Item(keys.get(i), body));
      }
    }
    return items;
  }

  private static String stripTrailingChoiceBlock(String text) {
    return text
        .replaceAll("(?is)\\s*[A-Da-d]\\.\\s*[a-e](\\s*[–\\-—,]\\s*[a-e]){2,}.*$", "")
        .trim();
  }

  private static String extractStem(String promptText) {
    String normalized = promptText.replace("\r\n", "\n");
    Matcher matcher = ITEM_LABEL_RE.matcher(normalized);
    if (matcher.find()) {
      int cut = matcher.start();
      if (cut > 0) {
        return normalized.substring(0, cut).trim();
      }
    }
    Matcher inline = INLINE_ITEM_LABEL_RE.matcher(normalized);
    if (inline.find() && inline.start() > 0) {
      return normalized.substring(0, inline.start()).trim();
    }
    return normalized.trim();
  }

  private record Item(String key, String text) {}
}
