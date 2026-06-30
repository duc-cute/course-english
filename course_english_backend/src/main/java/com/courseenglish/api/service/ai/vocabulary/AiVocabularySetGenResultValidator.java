package com.courseenglish.api.service.ai.vocabulary;

import com.courseenglish.api.service.ai.vocabulary.dto.AiVocabularySetGenEnvelopeDTO;
import com.courseenglish.api.service.ai.vocabulary.dto.AiVocabularySetItemDTO;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class AiVocabularySetGenResultValidator {

  private static final int TITLE_MAX_LEN = 255;
  private static final int DESCRIPTION_MAX_LEN = 2000;
  private static final int WORD_EN_MAX_LEN = 255;
  private static final int EXAMPLE_MAX_LEN = 500;
  private static final int COVER_PROMPT_MAX_LEN = 1000;
  private static final Pattern POS_PATTERN =
      Pattern.compile("^(noun|verb|adjective|adverb|phrase|preposition|conjunction|interjection|pronoun)$",
          Pattern.CASE_INSENSITIVE);

  private final ObjectMapper objectMapper;

  public AiVocabularySetGenResultValidator(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public AiVocabularySetGenEnvelopeDTO parseAndValidate(String json, int expectedWordCount)
      throws IdInvalidException {
    if (json == null || json.isBlank()) {
      throw new IdInvalidException("AI không trả dữ liệu");
    }

    JsonNode root;
    try {
      root = objectMapper.readTree(json);
    } catch (Exception e) {
      throw new IdInvalidException("AI trả JSON không hợp lệ");
    }

    String title = requiredText(root, "title", TITLE_MAX_LEN, "tiêu đề bộ từ");
    String description = optionalText(root, "description", DESCRIPTION_MAX_LEN);
    if (description == null || description.isBlank()) {
      description = "Bộ từ vựng do AI sinh";
    }
    String coverImagePrompt = optionalText(root, "coverImagePrompt", COVER_PROMPT_MAX_LEN);

    JsonNode itemsNode = root.get("items");
    if (itemsNode == null || !itemsNode.isArray() || itemsNode.isEmpty()) {
      throw new IdInvalidException("Danh sách từ trống");
    }

    List<AiVocabularySetItemDTO> items = new ArrayList<>();
    Set<String> seenWords = new HashSet<>();

    for (int i = 0; i < itemsNode.size(); i++) {
      JsonNode itemNode = itemsNode.get(i);
      String wordEn = requiredText(itemNode, "wordEn", WORD_EN_MAX_LEN, "từ tiếng Anh dòng " + (i + 1));
      String meaningVi = requiredText(itemNode, "meaningVi", 2000, "nghĩa tiếng Việt dòng " + (i + 1));

      String wordKey = wordEn.toLowerCase(Locale.ROOT);
      if (!seenWords.add(wordKey)) {
        throw new IdInvalidException("Từ \"" + wordEn + "\" bị trùng trong kết quả AI");
      }

      AiVocabularySetItemDTO item = new AiVocabularySetItemDTO();
      item.setWordEn(wordEn);
      item.setMeaningVi(meaningVi);
      item.setPartOfSpeech(normalizePartOfSpeech(optionalText(itemNode, "partOfSpeech", 64)));
      item.setExampleSentence(optionalText(itemNode, "exampleSentence", EXAMPLE_MAX_LEN));
      items.add(item);
    }

    if (items.size() != expectedWordCount) {
      throw new IdInvalidException(
          "AI trả " + items.size() + " từ, yêu cầu đúng " + expectedWordCount + " từ");
    }

    AiVocabularySetGenEnvelopeDTO envelope = new AiVocabularySetGenEnvelopeDTO();
    envelope.setTitle(title);
    envelope.setDescription(description);
    envelope.setCoverImagePrompt(coverImagePrompt);
    envelope.setItems(items);
    return envelope;
  }

  private static String normalizePartOfSpeech(String raw) throws IdInvalidException {
    if (raw == null || raw.isBlank()) {
      return null;
    }
    String normalized = raw.trim().toLowerCase(Locale.ROOT);
    if (!POS_PATTERN.matcher(normalized).matches()) {
      return null;
    }
    return normalized;
  }

  private static String requiredText(JsonNode node, String field, int maxLen, String label)
      throws IdInvalidException {
    String value = optionalText(node, field, maxLen);
    if (value == null || value.isBlank()) {
      throw new IdInvalidException("Thiếu " + label);
    }
    return value;
  }

  private static String optionalText(JsonNode node, String field, int maxLen) throws IdInvalidException {
    if (node == null || !node.has(field) || node.get(field).isNull()) {
      return null;
    }
    String value = node.get(field).asText("").trim();
    if (value.length() > maxLen) {
      throw new IdInvalidException(field + " quá dài (tối đa " + maxLen + " ký tự)");
    }
    return value;
  }
}
