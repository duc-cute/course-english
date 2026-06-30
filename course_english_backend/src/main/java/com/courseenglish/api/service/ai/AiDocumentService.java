package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.AiDocument;
import com.courseenglish.api.domain.request.ReqCreateTextDocumentDTO;
import com.courseenglish.api.domain.response.ResAiDocumentDTO;
import com.courseenglish.api.repository.AiDocumentRepository;
import com.courseenglish.api.service.ActivityLogService;
import com.courseenglish.api.service.FileService;
import com.courseenglish.api.service.activitylog.ActivityLogWriteContext;
import com.courseenglish.api.util.constant.ActivityLogActionEnum;
import com.courseenglish.api.util.constant.ActivityLogModuleEnum;
import com.courseenglish.api.util.constant.ActivityLogSeverityEnum;
import com.courseenglish.api.config.StorageProperties;
import com.courseenglish.api.util.constant.AiDocumentStatusEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class AiDocumentService {

  private static final Set<String> ALLOWED_EXT = Set.of("pdf", "docx");

  private final AiDocumentRepository aiDocumentRepository;
  private final FileService fileService;
  private final DocumentTextExtractor documentTextExtractor;
  private final StorageProperties storageProperties;
  private final AiAccessSupport aiAccessSupport;
  private final ActivityLogService activityLogService;

  @Value("${app.ai.max-document-mb:10}")
  private long maxDocumentMb;

  @Value("${app.ai.max-document-pages:20}")
  private int maxDocumentPages;

  @Value("${app.ai.max-extract-text-chars:100000}")
  private int maxExtractTextChars;

  @Value("${app.ai.min-paste-text-chars:80}")
  private int minPasteTextChars;

  public AiDocumentService(
      AiDocumentRepository aiDocumentRepository,
      FileService fileService,
      DocumentTextExtractor documentTextExtractor,
      StorageProperties storageProperties,
      AiAccessSupport aiAccessSupport,
      ActivityLogService activityLogService) {
    this.aiDocumentRepository = aiDocumentRepository;
    this.fileService = fileService;
    this.documentTextExtractor = documentTextExtractor;
    this.storageProperties = storageProperties;
    this.aiAccessSupport = aiAccessSupport;
    this.activityLogService = activityLogService;
  }

  @Transactional
  public ResAiDocumentDTO upload(MultipartFile file) throws IdInvalidException {
    aiAccessSupport.requireAiEnabled();
    aiAccessSupport.requireStaffUser();
    UUID userId = aiAccessSupport.currentUserId();

    if (file == null || file.isEmpty()) {
      throw new IdInvalidException("File trống");
    }
    long maxBytes = maxDocumentMb * 1024L * 1024L;
    if (file.getSize() > maxBytes) {
      throw new IdInvalidException("File vượt quá " + maxDocumentMb + " MB");
    }

    String originalName = file.getOriginalFilename() == null ? "document" : file.getOriginalFilename();
    String ext = extension(originalName);
    if (!ALLOWED_EXT.contains(ext)) {
      throw new IdInvalidException("Chỉ hỗ trợ PDF hoặc DOCX");
    }

    String storedName;
    try {
      fileService.createDirectory(AiDocument.STORAGE_FOLDER);
      storedName = fileService.store(file, AiDocument.STORAGE_FOLDER);
    } catch (IOException e) {
      throw new IdInvalidException("Không lưu được file: " + e.getMessage());
    }

    AiDocument entity = new AiDocument();
    entity.setUserId(userId);
    entity.setFileName(originalName);
    entity.setMimeType(normalizeMimeType(file.getContentType(), ext));
    entity.setStorageFolder(AiDocument.STORAGE_FOLDER);
    entity.setStorageFileName(storedName);
    entity.setFileSizeBytes(file.getSize());
    entity.setStatus(AiDocumentStatusEnum.EXTRACTING);

    Long extractMs = null;
    Integer extractedPageCount = null;
    int extractedTextChars = 0;

    try {
      long extractStartedMs = System.currentTimeMillis();
      Path filePath = storageProperties.getRootPath()
          .resolve(AiDocument.STORAGE_FOLDER)
          .resolve(storedName)
          .normalize();

      DocumentTextExtractor.ExtractResult extracted =
          documentTextExtractor.extract(filePath, file.getContentType(), maxDocumentPages);
      String text = extracted.text();
      if (text.length() > maxExtractTextChars) {
        text = text.substring(0, maxExtractTextChars);
      }
      if (text.isBlank()) {
        throw new IdInvalidException("Không trích xuất được nội dung từ file");
      }

      entity.setExtractedText(text);
      entity.setPageCount(extracted.pageCount());
      entity.setStatus(AiDocumentStatusEnum.READY);
      entity.setErrorMessage(null);

      extractMs = System.currentTimeMillis() - extractStartedMs;
      extractedPageCount = extracted.pageCount();
      extractedTextChars = text.length();
    } catch (IOException e) {
      entity.setStatus(AiDocumentStatusEnum.FAILED);
      entity.setErrorMessage("Không đọc được file: " + e.getMessage());
    } catch (IdInvalidException e) {
      entity.setStatus(AiDocumentStatusEnum.FAILED);
      entity.setErrorMessage(e.getMessage());
    }

    aiDocumentRepository.save(entity);
    if (entity.getStatus() == AiDocumentStatusEnum.FAILED) {
      String err = entity.getErrorMessage() != null
          ? entity.getErrorMessage()
          : "Trích xuất tài liệu thất bại";
      activityLogService.log(
          ActivityLogWriteContext.of(
                  ActivityLogSeverityEnum.ERROR,
                  ActivityLogModuleEnum.AI,
                  ActivityLogActionEnum.AI_DOC_FAIL,
                  err)
              .userId(userId)
              .ref("AI_DOCUMENT", entity.getId())
              .put("fileName", entity.getFileName())
              .put("mimeType", entity.getMimeType()));
      throw new IdInvalidException(err);
    }

    if (extractMs != null) {
      activityLogService.log(
          ActivityLogWriteContext.of(
                  ActivityLogSeverityEnum.INFO,
                  ActivityLogModuleEnum.AI,
                  ActivityLogActionEnum.AI_DOC_READY,
                  formatDocReadyMessage("upload", extractedTextChars, extractMs, extractedPageCount))
              .userId(userId)
              .ref("AI_DOCUMENT", entity.getId())
              .put("documentId", entity.getId())
              .put("step", "extract_text")
              .put("source", "upload")
              .put("durationMs", extractMs)
              .put("textChars", extractedTextChars)
              .put("estimatedTextTokens", Math.max(1, extractedTextChars / 4))
              .put("pageCount", extractedPageCount)
              .put("fileName", originalName)
              .put("mimeType", entity.getMimeType()));
    }
    return toDto(entity);
  }

  @Transactional
  public ResAiDocumentDTO createFromText(ReqCreateTextDocumentDTO request) throws IdInvalidException {
    aiAccessSupport.requireAiEnabled();
    aiAccessSupport.requireStaffUser();
    UUID userId = aiAccessSupport.currentUserId();

    String text = request.getText() == null ? "" : request.getText().trim();
    if (text.length() < minPasteTextChars) {
      throw new IdInvalidException("Nội dung cần ít nhất " + minPasteTextChars + " ký tự");
    }
    if (text.length() > maxExtractTextChars) {
      text = text.substring(0, maxExtractTextChars);
    }

    String title = request.getTitle() != null ? request.getTitle().trim() : "";
    String fileName = title.isBlank() ? "Pasted text" : title;
    String storageKey = "paste-" + UUID.randomUUID() + ".txt";

    AiDocument entity = new AiDocument();
    entity.setUserId(userId);
    entity.setFileName(fileName);
    entity.setMimeType("text/plain");
    entity.setStorageFolder(AiDocument.STORAGE_FOLDER);
    entity.setStorageFileName(storageKey);
    entity.setFileSizeBytes((long) text.getBytes(java.nio.charset.StandardCharsets.UTF_8).length);
    entity.setPageCount(1);
    entity.setExtractedText(text);
    entity.setStatus(AiDocumentStatusEnum.READY);
    entity.setErrorMessage(null);

    aiDocumentRepository.save(entity);

    int textChars = text.length();
    activityLogService.log(
        ActivityLogWriteContext.of(
                ActivityLogSeverityEnum.INFO,
                ActivityLogModuleEnum.AI,
                ActivityLogActionEnum.AI_DOC_READY,
                formatDocReadyMessage("paste", textChars, 0L, 1))
            .userId(userId)
            .ref("AI_DOCUMENT", entity.getId())
            .put("documentId", entity.getId())
            .put("step", "extract_text")
            .put("source", "paste")
            .put("durationMs", 0)
            .put("textChars", textChars)
            .put("estimatedTextTokens", Math.max(1, textChars / 4))
            .put("pageCount", 1)
            .put("fileName", fileName)
            .put("mimeType", entity.getMimeType()));

    return toDto(entity);
  }

  @Transactional
  public AiDocument createTopicBriefDocument(
      UUID userId,
      String topic,
      Integer grade,
      String languageLevel,
      String additionalInstructions) throws IdInvalidException {
    aiAccessSupport.requireAiEnabled();
    aiAccessSupport.requireStaffUser();

    String text = buildTopicBriefText(topic, grade, languageLevel, additionalInstructions);
    String fileName = "Topic: " + (topic.length() > 60 ? topic.substring(0, 60) + "…" : topic);
    String storageKey = "topic-" + UUID.randomUUID() + ".txt";

    AiDocument entity = new AiDocument();
    entity.setUserId(userId);
    entity.setFileName(fileName);
    entity.setMimeType("text/plain");
    entity.setStorageFolder(AiDocument.STORAGE_FOLDER);
    entity.setStorageFileName(storageKey);
    entity.setFileSizeBytes((long) text.getBytes(java.nio.charset.StandardCharsets.UTF_8).length);
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
                "Topic brief: " + topic)
            .userId(userId)
            .ref("AI_DOCUMENT", entity.getId())
            .put("documentId", entity.getId())
            .put("step", "topic_brief")
            .put("source", "topic")
            .put("textChars", text.length())
            .put("fileName", fileName));

    return entity;
  }

  @Transactional
  public AiDocument createSimilarExamStubDocument(
      UUID userId,
      UUID sourceExamPaperId,
      String sourceTitle,
      int sectionCount,
      int totalQuestions)
      throws IdInvalidException {
    aiAccessSupport.requireAiEnabled();
    aiAccessSupport.requireStaffUser();

    String safeTitle = sourceTitle != null ? sourceTitle.trim() : "Exam";
    String text =
        """
            SIMILAR EXAM PAPER GENERATION
            Source exam ID: %s
            Source title: %s
            Sections: %d
            Total reference items: %d
            Per-section reference excerpts are stored in the generation task (answers redacted).
            """
            .formatted(sourceExamPaperId, safeTitle, sectionCount, totalQuestions);

    String fileName = "Similar: " + (safeTitle.length() > 50 ? safeTitle.substring(0, 50) + "…" : safeTitle);
    String storageKey = "similar-" + UUID.randomUUID() + ".txt";

    AiDocument entity = new AiDocument();
    entity.setUserId(userId);
    entity.setFileName(fileName);
    entity.setMimeType("text/plain");
    entity.setStorageFolder(AiDocument.STORAGE_FOLDER);
    entity.setStorageFileName(storageKey);
    entity.setFileSizeBytes((long) text.getBytes(java.nio.charset.StandardCharsets.UTF_8).length);
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
                "Similar exam stub document for source " + sourceExamPaperId)
            .userId(userId)
            .ref("AI_DOCUMENT", entity.getId())
            .put("documentId", entity.getId())
            .put("step", "similar_exam_stub")
            .put("sourceExamPaperId", sourceExamPaperId)
            .put("sectionCount", sectionCount)
            .put("totalQuestions", totalQuestions)
            .put("fileName", fileName));

    return entity;
  }

  public static String buildTopicBriefText(
      String topic,
      Integer grade,
      String languageLevel,
      String additionalInstructions) {
    StringBuilder sb = new StringBuilder();
    sb.append("TOPIC BRIEF FOR AI QUESTION GENERATION\n\n");
    sb.append("Topic: ").append(topic.trim()).append('\n');
    if (grade != null) {
      sb.append("Grade: ").append(grade).append('\n');
    }
    if (languageLevel != null && !languageLevel.isBlank()) {
      sb.append("Language level: ").append(languageLevel.trim()).append('\n');
    }
    if (additionalInstructions != null && !additionalInstructions.isBlank()) {
      sb.append("Additional instructions: ").append(additionalInstructions.trim()).append('\n');
    }
    sb.append("\nCreate original English learning content aligned with this brief.");
    return sb.toString();
  }

  public ResAiDocumentDTO getById(UUID id) throws IdInvalidException {
    aiAccessSupport.requireStaffUser();
    UUID userId = aiAccessSupport.currentUserId();
    AiDocument entity = aiDocumentRepository.findByIdAndUserIdAndVoidedFalse(id, userId)
        .orElseThrow(() -> new IdInvalidException("Tài liệu không tồn tại"));
    return toDto(entity);
  }

  public AiDocument requireReadyDocument(UUID id, UUID userId) throws IdInvalidException {
    return aiDocumentRepository
        .findByIdAndUserIdAndStatusAndVoidedFalse(id, userId, AiDocumentStatusEnum.READY)
        .orElseThrow(() -> new IdInvalidException("Tài liệu chưa sẵn sàng hoặc không tồn tại"));
  }

  private ResAiDocumentDTO toDto(AiDocument entity) {
    ResAiDocumentDTO dto = new ResAiDocumentDTO();
    dto.setId(entity.getId());
    dto.setFileName(entity.getFileName());
    dto.setMimeType(entity.getMimeType());
    dto.setStatus(entity.getStatus());
    dto.setPageCount(entity.getPageCount());
    dto.setErrorMessage(entity.getErrorMessage());
    return dto;
  }

  private String extension(String fileName) {
    int dot = fileName.lastIndexOf('.');
    if (dot < 0) {
      return "";
    }
    return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
  }

  private String normalizeMimeType(String rawMime, String ext) {
    String mime = rawMime == null ? "" : rawMime.trim().toLowerCase(Locale.ROOT);
    if (mime.contains("pdf") || "pdf".equals(ext)) {
      return "application/pdf";
    }
    if (mime.contains("wordprocessingml") || mime.contains("docx") || "docx".equals(ext)) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    if (mime.length() > 128) {
      return mime.substring(0, 128);
    }
    return mime.isEmpty() ? null : mime;
  }

  private static String formatDocReadyMessage(String source, int textChars, long extractMs, Integer pageCount) {
    StringBuilder sb = new StringBuilder();
    sb.append("[").append(source).append("] ");
    sb.append(formatThousands(textChars)).append(" chars (~").append(formatThousands(Math.max(1, textChars / 4)))
        .append(" tok)");
    if ("upload".equals(source) && extractMs > 0) {
      sb.append(" | extract ").append(formatDuration(extractMs));
    }
    if (pageCount != null && pageCount > 0) {
      sb.append(" | ").append(pageCount).append(" trang");
    }
    return sb.toString();
  }

  private static String formatThousands(int value) {
    if (value >= 1_000_000) {
      return String.format(Locale.ROOT, "%.1fM", value / 1_000_000.0);
    }
    if (value >= 1_000) {
      return String.format(Locale.ROOT, "%.1fk", value / 1_000.0);
    }
    return String.valueOf(value);
  }

  private static String formatDuration(long durationMs) {
    if (durationMs >= 60_000) {
      return String.format(Locale.ROOT, "%.1f phút", durationMs / 60_000.0);
    }
    if (durationMs >= 1_000) {
      return String.format(Locale.ROOT, "%.1fs", durationMs / 1_000.0);
    }
    return durationMs + "ms";
  }
}
