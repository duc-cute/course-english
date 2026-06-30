package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.AiDocument;
import com.courseenglish.api.domain.response.ResVocabularyItemDTO;
import com.courseenglish.api.domain.response.ResVocabularySetDTO;
import com.courseenglish.api.repository.AiDocumentRepository;
import com.courseenglish.api.service.ActivityLogService;
import com.courseenglish.api.service.VocabularySetService;
import com.courseenglish.api.service.activitylog.ActivityLogWriteContext;
import com.courseenglish.api.util.constant.ActivityLogActionEnum;
import com.courseenglish.api.util.constant.ActivityLogModuleEnum;
import com.courseenglish.api.util.constant.ActivityLogSeverityEnum;
import com.courseenglish.api.util.constant.AiDocumentStatusEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@Service
public class VocabularySetAiContextService {

  public static final String DOCUMENT_HEADER = "VOCABULARY SET FOR AI QUESTION GENERATION";

  private static final int MAX_WORDS_IN_DOCUMENT = 120;

  private final VocabularySetService vocabularySetService;
  private final AiDocumentRepository aiDocumentRepository;
  private final ActivityLogService activityLogService;

  public VocabularySetAiContextService(
      VocabularySetService vocabularySetService,
      AiDocumentRepository aiDocumentRepository,
      ActivityLogService activityLogService) {
    this.vocabularySetService = vocabularySetService;
    this.aiDocumentRepository = aiDocumentRepository;
    this.activityLogService = activityLogService;
  }

  public ResVocabularySetDTO requireSetForAiGen(UUID vocabularySetId) throws IdInvalidException {
    if (vocabularySetId == null) {
      throw new IdInvalidException("Thiếu vocabularySetId");
    }
    ResVocabularySetDTO set = vocabularySetService.getById(vocabularySetId);
    List<ResVocabularyItemDTO> items = set.getItems();
    if (items == null || items.isEmpty()) {
      throw new IdInvalidException("Bộ từ vựng chưa có từ nào");
    }
    long withWord = items.stream()
        .filter(i -> i.getWordEn() != null && !i.getWordEn().isBlank())
        .count();
    if (withWord < 1) {
      throw new IdInvalidException("Bộ từ vựng chưa có từ hợp lệ");
    }
    return set;
  }

  public static boolean isVocabularySetExcerpt(String excerpt) {
    return excerpt != null && excerpt.startsWith(DOCUMENT_HEADER);
  }

  public String buildVocabularySetDocumentText(
      ResVocabularySetDTO set,
      String languageLevel,
      String additionalInstructions) {
    StringBuilder sb = new StringBuilder();
    sb.append(DOCUMENT_HEADER).append("\n\n");
    sb.append("Set title: ").append(safe(set.getTitle())).append('\n');
    sb.append("Set ID: ").append(set.getId()).append('\n');
    if (set.getDescription() != null && !set.getDescription().isBlank()) {
      sb.append("Description: ").append(set.getDescription().trim()).append('\n');
    }
    if (languageLevel != null && !languageLevel.isBlank()) {
      sb.append("Language level: ").append(languageLevel.trim()).append('\n');
    }
    List<ResVocabularyItemDTO> items = set.getItems();
    int wordCount = items != null ? items.size() : 0;
    sb.append("Word count: ").append(wordCount).append("\n\n");
    sb.append("| # | English | Vietnamese | POS | Example |\n");
    sb.append("|---|---------|------------|-----|--------|\n");

    int index = 1;
    if (items != null) {
      for (ResVocabularyItemDTO item : items) {
        if (index > MAX_WORDS_IN_DOCUMENT) {
          sb.append("| … | (truncated) | | | |\n");
          break;
        }
        String word = safe(item.getWordEn());
        if (word.isBlank()) {
          continue;
        }
        sb.append("| ")
            .append(index++)
            .append(" | ")
            .append(word)
            .append(" | ")
            .append(safe(item.getMeaningVi()))
            .append(" | ")
            .append(safe(item.getPartOfSpeech()))
            .append(" | ")
            .append(truncate(safe(item.getExampleSentence()), 120))
            .append(" |\n");
      }
    }

    sb.append(
        """

        Generator rules:
        - Prioritize vocabulary from the table above.
        - Vary question styles (context, paraphrase, collocations); avoid only "word → meaning" drills.
        - Distractors must be plausible and distinct.
        - Write every explanation in Vietnamese (tiếng Việt) for Vietnamese learners; stems stay in English.
        - Do not use double quotes (") inside explanations — use «guillemets» for English words.
        """);
    if (additionalInstructions != null && !additionalInstructions.isBlank()) {
      sb.append("Additional instructions: ").append(additionalInstructions.trim()).append('\n');
    }
    return sb.toString();
  }

  public AiDocument createVocabularySetDocument(
      UUID userId,
      ResVocabularySetDTO set,
      String languageLevel,
      String additionalInstructions)
      throws IdInvalidException {
    String text = buildVocabularySetDocumentText(set, languageLevel, additionalInstructions);
    String title = set.getTitle() != null ? set.getTitle().trim() : "Vocabulary set";
    String fileName =
        "Vocab set: " + (title.length() > 50 ? title.substring(0, 50) + "…" : title);
    String storageKey = "vocab-set-" + set.getId() + "-" + UUID.randomUUID() + ".txt";

    AiDocument entity = new AiDocument();
    entity.setUserId(userId);
    entity.setFileName(fileName);
    entity.setMimeType("text/plain");
    entity.setStorageFolder(AiDocument.STORAGE_FOLDER);
    entity.setStorageFileName(storageKey);
    entity.setFileSizeBytes((long) text.getBytes(StandardCharsets.UTF_8).length);
    entity.setPageCount(1);
    entity.setExtractedText(text);
    entity.setStatus(AiDocumentStatusEnum.READY);
    entity.setErrorMessage(null);

    aiDocumentRepository.save(entity);

    activityLogService.log(
        ActivityLogWriteContext.of(
                ActivityLogSeverityEnum.INFO,
                ActivityLogModuleEnum.AI,
                ActivityLogActionEnum.AI_DOC_READY,
                "Vocabulary set context: " + title)
            .userId(userId)
            .ref("AI_DOCUMENT", entity.getId())
            .put("documentId", entity.getId())
            .put("step", "vocabulary_set")
            .put("source", "vocabulary-set")
            .put("vocabularySetId", set.getId())
            .put("wordCount", set.getItemCount())
            .put("textChars", text.length())
            .put("fileName", fileName));

    return entity;
  }

  private static String safe(String value) {
    return value != null ? value.trim() : "";
  }

  private static String truncate(String value, int max) {
    if (value.length() <= max) {
      return value;
    }
    return value.substring(0, max) + "…";
  }
}
