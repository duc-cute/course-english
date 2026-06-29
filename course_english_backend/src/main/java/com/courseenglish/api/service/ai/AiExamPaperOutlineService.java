package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.AiDocument;
import com.courseenglish.api.domain.request.ExamSectionGenSpecDTO;
import com.courseenglish.api.domain.request.ReqExamPaperOutlineDTO;
import com.courseenglish.api.domain.response.ResExamPaperOutlineDTO;
import com.courseenglish.api.service.impl.OpenRouterClient;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class AiExamPaperOutlineService {

  private static final int OUTLINE_EXCERPT_MAX_CHARS = 48_000;

  private final AiDocumentService aiDocumentService;
  private final AiAccessSupport aiAccessSupport;
  private final OpenRouterClient openRouterClient;
  private final ObjectMapper objectMapper;
  private final ExamSectionSliceService examSectionSliceService;

  @Value("${app.ai.question-gen-model:anthropic/claude-3.5-sonnet}")
  private String questionGenModel;

  @Value("${app.ai.exam-outline-max-sections:12}")
  private int maxSections;

  public AiExamPaperOutlineService(
      AiDocumentService aiDocumentService,
      AiAccessSupport aiAccessSupport,
      OpenRouterClient openRouterClient,
      ObjectMapper objectMapper,
      ExamSectionSliceService examSectionSliceService) {
    this.aiDocumentService = aiDocumentService;
    this.aiAccessSupport = aiAccessSupport;
    this.openRouterClient = openRouterClient;
    this.objectMapper = objectMapper;
    this.examSectionSliceService = examSectionSliceService;
  }

  public ResExamPaperOutlineDTO buildOutline(ReqExamPaperOutlineDTO request) throws IdInvalidException {
    aiAccessSupport.requireAiEnabled();
    aiAccessSupport.requireStaffUser();
    UUID userId = aiAccessSupport.currentUserId();

    AiDocument document =
        aiDocumentService.requireReadyDocument(request.getDocumentId(), userId);
    String text = document.getExtractedText();
    if (text == null || text.isBlank()) {
      throw new IdInvalidException("Tài liệu không có nội dung");
    }

    String excerpt = truncateExcerpt(text);
    List<String> warnings = new ArrayList<>();
    assessDocumentQuality(document, warnings);

    String systemPrompt =
        """
            You are an expert English exam paper analyst for a language center.
            Read the document excerpt and infer how to split it into exam SECTIONS for an LMS.

            Rules:
            - Each section = exactly ONE questionType + ONE student-facing instruction.
            - Sections that share questionType (e.g. two MULTIPLE_CHOICE blocks) MUST stay separate
              when their instructions differ (Synonyms vs Antonyms vs general MCQ).
            - Use instruction text as the boundary — do NOT merge distinct parts.
            - READING_COMPREHENSION: each section = ONE passage. questionCount = number of
              sub-questions in that passage (e.g. instruction "questions 11 to 20" → questionCount: 10).
            - GAP_FILL_MCQ: THPT cloze — one passage, Mark A/B/C/D per blank.
              questionCount = number of blanks (e.g. 6–10 → 5). NOT typed answers.
            - MULTIPLE_CHOICE / TRUE_FALSE: questionCount = scorable items in that section.
            - FILL_BLANK: ONLY when students TYPE a word (no A/B/C/D). Rare in THPT.
            - If instruction says "Mark the letter A, B, C or D" with cloze passage → GAP_FILL_MCQ.
            - If the file has no clear instruction for a part, write a standard English exam instruction.
            - Allowed questionType values: MULTIPLE_CHOICE, TRUE_FALSE, GAP_FILL_MCQ, FILL_BLANK, READING_COMPREHENSION.

            Output ONLY valid JSON (no markdown):
            {
              "examTitle": "string",
              "paperInstruction": "string or null",
              "sections": [
                {
                  "title": "PART I — MULTIPLE CHOICE",
                  "instruction": "Mark the letter A, B, C, or D...",
                  "questionType": "MULTIPLE_CHOICE",
                  "questionCount": 12
                }
              ]
            }
            """;

    String userPrompt =
        """
            Document excerpt:
            ---
            %s
            ---

            Infer exam title, optional paper-level instruction, and sections array.
            Return JSON only.
            """
            .formatted(excerpt);

    OpenRouterClient.ChatResult chat =
        openRouterClient.chatJson(
            questionGenModel,
            List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)));

    ResExamPaperOutlineDTO outline = parseOutlineJson(chat.getContent(), warnings);
    if (outline.getSections().isEmpty()) {
      warnings.add("AI không nhận diện được phần nào — hãy chỉnh outline thủ công hoặc thử PDF/dán text.");
    } else {
      examSectionSliceService.applySlices(text, outline.getSections(), warnings);
    }
    outline.setWarnings(warnings);
    return outline;
  }

  private ResExamPaperOutlineDTO parseOutlineJson(String json, List<String> warnings)
      throws IdInvalidException {
    try {
      JsonNode root = objectMapper.readTree(json);
      ResExamPaperOutlineDTO dto = new ResExamPaperOutlineDTO();
      dto.setExamTitle(textOrNull(root, "examTitle"));
      dto.setPaperInstruction(textOrNull(root, "paperInstruction"));

      JsonNode sectionsNode = root.get("sections");
      if (sectionsNode == null || !sectionsNode.isArray()) {
        return dto;
      }

      List<ExamSectionGenSpecDTO> sections = new ArrayList<>();
      for (JsonNode node : sectionsNode) {
        ExamSectionGenSpecDTO spec = new ExamSectionGenSpecDTO();
        spec.setTitle(textOrNull(node, "title"));
        spec.setInstruction(textOrNull(node, "instruction"));
        QuestionTypeEnum type = parseQuestionType(node.get("questionType"));
        if (type == null) {
          warnings.add("Bỏ qua một section — questionType không hợp lệ.");
          continue;
        }
        spec.setQuestionType(type);
        int count = node.has("questionCount") ? node.get("questionCount").asInt(5) : 5;
        spec.setQuestionCount(Math.max(1, Math.min(50, count)));
        sections.add(spec);
        if (sections.size() >= maxSections) {
          warnings.add("Chỉ giữ tối đa " + maxSections + " section — phần còn lại cần thêm thủ công.");
          break;
        }
      }
      dto.setSections(sections);
      return dto;
    } catch (Exception e) {
      throw new IdInvalidException("AI trả outline không hợp lệ — thử lại hoặc dán text rõ hơn");
    }
  }

  private QuestionTypeEnum parseQuestionType(JsonNode node) {
    if (node == null || node.isNull()) {
      return null;
    }
    String raw = node.asText("").trim().toUpperCase(Locale.ROOT);
    if (raw.isEmpty()) {
      return null;
    }
    try {
      return QuestionTypeEnum.valueOf(raw);
    } catch (IllegalArgumentException e) {
      return null;
    }
  }

  private String textOrNull(JsonNode node, String field) {
    JsonNode child = node.get(field);
    if (child == null || child.isNull()) {
      return null;
    }
    String text = child.asText("").trim();
    return text.isEmpty() ? null : text;
  }

  private String truncateExcerpt(String text) {
    if (text.length() <= OUTLINE_EXCERPT_MAX_CHARS) {
      return text;
    }
    return text.substring(0, OUTLINE_EXCERPT_MAX_CHARS)
        + "\n\n[... document truncated for outline analysis ...]";
  }

  private void assessDocumentQuality(AiDocument document, List<String> warnings) {
    String text = document.getExtractedText();
    if (text.length() < 200) {
      warnings.add("Nội dung extract rất ngắn — kiểm tra file hoặc dán text đầy đủ hơn.");
    }
    String mime = document.getMimeType();
    if (mime != null && mime.toLowerCase(Locale.ROOT).contains("word")) {
      long lineBreaks = text.chars().filter(ch -> ch == '\n').count();
      long tabs = text.chars().filter(ch -> ch == '\t').count();
      if (lineBreaks < 5 && text.length() > 500 && tabs == 0) {
        warnings.add(
            "Word có thể bị lộn layout khi extract — nên thử PDF text-layer hoặc dán nội dung.");
      }
    }
    Set<String> noisy = new LinkedHashSet<>();
    String[] lines = text.split("\n", 80);
    int shortLines = 0;
    for (String line : lines) {
      if (line.trim().length() <= 2) {
        shortLines++;
      }
    }
    if (shortLines > lines.length * 0.4 && text.length() > 300) {
      noisy.add("scan");
    }
    if (!noisy.isEmpty()) {
      warnings.add("File có dấu hiệu scan/layout xấu — nên xem lại outline trước khi sinh câu.");
    }
  }
}
