package com.courseenglish.api.service.ai.vocabulary;

import com.courseenglish.api.domain.request.ReqCreateVocabularySetGenTaskDTO;
import com.courseenglish.api.repository.AiTaskRepository;
import com.courseenglish.api.service.ai.AiTaskProgressReporter;
import com.courseenglish.api.service.ai.vocabulary.dto.AiVocabularySetGenEnvelopeDTO;
import com.courseenglish.api.service.ai.vocabulary.dto.AiVocabularySetGenMetaDTO;
import com.courseenglish.api.service.impl.OpenRouterClient;
import com.courseenglish.api.util.AppConstants;
import com.courseenglish.api.util.error.IdInvalidException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AiVocabularySetGenerationService {

  private static final Logger log = LoggerFactory.getLogger(AiVocabularySetGenerationService.class);
  private static final int MAX_JSON_RETRIES = 2;

  private final OpenRouterClient openRouterClient;
  private final AiVocabularySetPromptAssembler promptAssembler;
  private final AiVocabularySetGenResultValidator resultValidator;
  private final AiTaskProgressReporter progressReporter;
  private final VocabularySetCoverImageService coverImageService;
  private final AiTaskRepository aiTaskRepository;

  public AiVocabularySetGenerationService(
      OpenRouterClient openRouterClient,
      AiVocabularySetPromptAssembler promptAssembler,
      AiVocabularySetGenResultValidator resultValidator,
      AiTaskProgressReporter progressReporter,
      VocabularySetCoverImageService coverImageService,
      AiTaskRepository aiTaskRepository) {
    this.openRouterClient = openRouterClient;
    this.promptAssembler = promptAssembler;
    this.resultValidator = resultValidator;
    this.progressReporter = progressReporter;
    this.coverImageService = coverImageService;
    this.aiTaskRepository = aiTaskRepository;
  }

  public AiVocabularySetGenEnvelopeDTO generate(ReqCreateVocabularySetGenTaskDTO request, UUID taskId)
      throws IdInvalidException {
    String system = promptAssembler.buildSystemPrompt();
    String user = promptAssembler.buildUserPrompt(request);

    progressReporter.report(taskId, "Đang gọi AI sinh bộ từ…", 40);

    IdInvalidException lastError = null;
    AiVocabularySetGenEnvelopeDTO envelope = null;
    for (int attempt = 0; attempt <= MAX_JSON_RETRIES; attempt++) {
      try {
        List<Map<String, String>> messages =
            List.of(
                Map.of("role", "system", "content", system),
                Map.of("role", "user", "content", user));

        OpenRouterClient.ChatResult chat =
            openRouterClient.chatJson(
                AppConstants.aiVocabSetGenModel, messages, AppConstants.aiVocabSetGenTimeoutSec);

        progressReporter.report(taskId, "Đang kiểm tra kết quả…", 70);
        envelope = resultValidator.parseAndValidate(chat.getContent(), request.getWordCount());
        break;
      } catch (IdInvalidException ex) {
        lastError = ex;
        if (attempt < MAX_JSON_RETRIES) {
          progressReporter.report(taskId, "Kết quả chưa hợp lệ, thử lại…", 55);
        }
      }
    }

    if (envelope == null) {
      throw lastError != null ? lastError : new IdInvalidException("Không sinh được bộ từ vựng");
    }

    if (request.isGenerateCover()
        && envelope.getCoverImagePrompt() != null
        && !envelope.getCoverImagePrompt().isBlank()) {
      if (!AppConstants.aiVocabSetCoverImageEnabled) {
        log.info("[VocabSetGen] skip cover generation taskId={} because cover image disabled by SystemConfig", taskId);
      } else if (isCoverImageDailyLimitReached()) {
        progressReporter.report(taskId, "Vượt giới hạn ảnh cover hôm nay — bỏ qua bước sinh ảnh", 90);
        log.warn(
            "[VocabSetGen] skip cover generation taskId={} because daily limit reached (limit={})",
            taskId,
            AppConstants.aiVocabSetCoverImageDailyLimit);
      } else {
        try {
          log.debug(
              "[VocabSetGen] cover generation start taskId={} textModel={} promptLength={} promptPreview={}",
              taskId,
              AppConstants.aiVocabSetGenModel,
              envelope.getCoverImagePrompt().length(),
              previewPrompt(envelope.getCoverImagePrompt()));

          progressReporter.report(taskId, "Đang sinh ảnh cover…", 85);
          String coverUrl = coverImageService.generateAndStoreCover(envelope.getCoverImagePrompt(), taskId);
          envelope.setCoverImageUrl(coverUrl);
          log.info("[VocabSetGen] cover generation success taskId={} coverUrl={}", taskId, coverUrl);
        } catch (IdInvalidException ex) {
          log.warn("[VocabSetGen] cover image failed taskId={} reason={}", taskId, ex.getMessage(), ex);
        }
      }
    } else if (request.isGenerateCover()) {
      log.info("[VocabSetGen] skip cover generation taskId={} because prompt missing/blank from AI", taskId);
    } else {
      log.info("[VocabSetGen] skip cover generation taskId={} because generateCover=false", taskId);
    }

    AiVocabularySetGenMetaDTO meta = new AiVocabularySetGenMetaDTO();
    meta.setModel(AppConstants.aiVocabSetGenModel);
    meta.setItemCount(envelope.getItems().size());
    meta.setSummaryMessage("Đã sinh " + envelope.getItems().size() + " từ vựng");
    envelope.setMeta(meta);

    progressReporter.report(taskId, "Hoàn tất", 100);
    return envelope;
  }

  private boolean isCoverImageDailyLimitReached() {
    if (AppConstants.aiVocabSetCoverImageDailyLimit <= 0) {
      return false;
    }
    ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
    Instant start = now.toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();
    Instant end = start.plusSeconds(24 * 60 * 60L);

    long used =
        aiTaskRepository.countDoneTasksWithCoverImageByTypeAndCreatedAtBetween(
            "VOCABULARY_SET_GENERATION", "DONE", start, end);
    boolean reached = used >= AppConstants.aiVocabSetCoverImageDailyLimit;
    if (reached) {
      log.warn(
          "[VocabSetGen] cover daily limit reached used={} limit={} windowStartUtc={}",
          used,
          AppConstants.aiVocabSetCoverImageDailyLimit,
          start);
    } else {
      log.info(
          "[VocabSetGen] cover daily quota used={}/{} windowStartUtc={}",
          used,
          AppConstants.aiVocabSetCoverImageDailyLimit,
          start);
    }
    return reached;
  }

  private String previewPrompt(String prompt) {
    String normalized = prompt.replace('\n', ' ').replace('\r', ' ').trim();
    if (normalized.length() <= 160) {
      return normalized;
    }
    return normalized.substring(0, 160) + "...";
  }
}
