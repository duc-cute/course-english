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
import java.util.regex.Pattern;

@Service
public class AiExamPaperOutlineService {

  private static final int OUTLINE_EXCERPT_MAX_CHARS = 48_000;

  /** THPT cloze slot: (1) _______ */
  private static final Pattern NUMBERED_BLANK_SLOT =
      Pattern.compile("\\(\\s*[1-9]\\d*\\s*\\)\\s*[_.…]{2,}");

  /** "best fits each of the numbered blanks from 1 to 6" */
  private static final Pattern NUMBERED_BLANKS_INSTRUCTION =
      Pattern.compile(
          "(?i)numbered\\s+blanks?(?:\\s+from\\s+\\d+\\s+to\\s+\\d+)?|blanks?\\s+from\\s+\\d+\\s+to\\s+\\d+");

  private static final Pattern MARK_ABCD =
      Pattern.compile("(?i)mark\\s+the\\s+letter\\s+a\\s*,?\\s*b\\s*,?\\s*c\\s*,?\\s*(?:or\\s+)?d");

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
            - GAP_FILL_MCQ: THPT cloze — ONE passage with blanks (1)(2)… and Question N options A/B/C/D
              under the passage. questionCount = number of blanks (e.g. 6). NOT typed answers.
              Output ONE LMS item (not N separate MCQs).
            - MULTIPLE_CHOICE: standalone stems with A/B/C/D — NO shared cloze passage / numbered blanks.
            - TRUE_FALSE: questionCount = scorable items in that section.
            - FILL_BLANK: ONLY when students TYPE a word (no A/B/C/D). Rare in THPT.
            - If instruction says "Mark the letter A, B, C or D" AND "numbered blanks" / cloze passage
              → ALWAYS GAP_FILL_MCQ (never MULTIPLE_CHOICE, never FILL_BLANK).
            - NEVER split a cloze passage into multiple MULTIPLE_CHOICE sections/items.
            - If the file has no clear instruction for a part, write a standard English exam instruction.
            - Allowed questionType values: MULTIPLE_CHOICE, TRUE_FALSE, GAP_FILL_MCQ, FILL_BLANK, READING_COMPREHENSION.

            Output ONLY valid JSON (no markdown):
            {
              "examTitle": "string",
              "paperInstruction": "string or null",
              "sections": [
                {
                  "title": "PART I — CLOZE",
                  "instruction": "Read the following passage and mark the letter A, B, C, or D to indicate the correct option that best fits each of the numbered blanks from 1 to 6.",
                  "questionType": "GAP_FILL_MCQ",
                  "questionCount": 6
                },
                {
                  "title": "PART II — MULTIPLE CHOICE",
                  "instruction": "Mark the letter A, B, C, or D to indicate the correct answer to each of the following questions.",
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
      reclassifyClozeAsGapFillMcq(text, outline.getSections(), warnings);
      examSectionSliceService.applySlices(text, outline.getSections(), warnings);
    }
    outline.setWarnings(warnings);
    return outline;
  }

  /**
   * LLM often mis-labels THPT cloze (passage + numbered blanks + A/B/C/D) as MULTIPLE_CHOICE.
   * Correct to {@link QuestionTypeEnum#GAP_FILL_MCQ} using instruction + document signals.
   */
  void reclassifyClozeAsGapFillMcq(
      String documentText, List<ExamSectionGenSpecDTO> sections, List<String> warnings) {
    if (sections == null || sections.isEmpty()) {
      return;
    }
    String doc = documentText != null ? documentText : "";
    boolean docHasNumberedBlankSlots = NUMBERED_BLANK_SLOT.matcher(doc).find();

    for (ExamSectionGenSpecDTO spec : sections) {
      QuestionTypeEnum type = spec.getQuestionType();
      if (type != QuestionTypeEnum.MULTIPLE_CHOICE && type != QuestionTypeEnum.FILL_BLANK) {
        continue;
      }
      if (!looksLikeGapFillMcq(spec.getTitle(), spec.getInstruction(), docHasNumberedBlankSlots)) {
        continue;
      }
      spec.setQuestionType(QuestionTypeEnum.GAP_FILL_MCQ);
      int blanks = inferBlankCount(spec.getInstruction(), doc, spec.getQuestionCount());
      spec.setQuestionCount(blanks);
      String label =
          spec.getTitle() != null && !spec.getTitle().isBlank() ? spec.getTitle() : "section";
      warnings.add(
          "Đã chỉnh \""
              + label
              + "\": "
              + type.name()
              + " → GAP_FILL_MCQ (cloze A/B/C/D, "
              + blanks
              + " ô trống).");
    }
  }

  private boolean looksLikeGapFillMcq(
      String title, String instruction, boolean docHasNumberedBlankSlots) {
    String probe =
        ((title == null ? "" : title) + "\n" + (instruction == null ? "" : instruction))
            .toLowerCase(Locale.ROOT);
    if (probe.isBlank()) {
      // Không đoán chỉ từ file — tránh đổi nhầm section MCQ thường trong đề nhiều phần.
      return false;
    }

    boolean numberedBlanks = NUMBERED_BLANKS_INSTRUCTION.matcher(probe).find();
    boolean markAbcd = MARK_ABCD.matcher(probe).find()
        || probe.contains("a, b, c, or d")
        || probe.contains("a, b, c or d");
    boolean clozeWord =
        probe.contains("cloze")
            || probe.contains("gap-fill")
            || probe.contains("gap fill")
            || probe.contains("điền từ vào chỗ trống")
            || probe.contains("chỗ trống");
    boolean mentionsBlank = probe.contains("blank") || probe.contains("chỗ trống");

    // "numbered blanks from 1 to 6" — tín hiệu mạnh nhất (đúng đề user)
    if (numberedBlanks) {
      return true;
    }
    // Instruction cloze + Mark A/B/C/D
    if (markAbcd && clozeWord) {
      return true;
    }
    // Mark A/B/C/D + nói blank + file có (1) _______
    if (markAbcd && mentionsBlank && docHasNumberedBlankSlots) {
      return true;
    }
    if (clozeWord && docHasNumberedBlankSlots) {
      return true;
    }
    return false;
  }

  private int inferBlankCount(String instruction, String documentText, Integer currentCount) {
    if (instruction != null) {
      var fromTo =
          Pattern.compile("(?i)blanks?\\s+from\\s+(\\d+)\\s+to\\s+(\\d+)").matcher(instruction);
      if (fromTo.find()) {
        int from = Integer.parseInt(fromTo.group(1));
        int to = Integer.parseInt(fromTo.group(2));
        if (to >= from && to - from + 1 <= 12) {
          return Math.max(2, to - from + 1);
        }
      }
    }
    int slots = 0;
    var matcher = NUMBERED_BLANK_SLOT.matcher(documentText != null ? documentText : "");
    while (matcher.find()) {
      slots++;
      if (slots >= 12) {
        break;
      }
    }
    if (slots >= 2) {
      return slots;
    }
    int fallback = currentCount != null ? currentCount : 6;
    return Math.max(2, Math.min(12, fallback));
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
