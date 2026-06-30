package com.courseenglish.api.service.ai.question;

import com.courseenglish.api.service.ai.VocabularySetAiContextService;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class AiQuestionPromptAssembler {

  private final AiQuestionTypeHandlerRegistry registry;

  public AiQuestionPromptAssembler(AiQuestionTypeHandlerRegistry registry) {
    this.registry = registry;
  }

  public String buildSystemPrompt(List<QuestionTypeEnum> questionTypes) {
    return buildSystemPromptForTypes(questionTypes, false);
  }

  public String buildSystemPromptForType(QuestionTypeEnum type) {
    return buildSystemPromptForType(type, false);
  }

  public String buildSystemPromptForType(QuestionTypeEnum type, boolean topicMode) {
    return buildSystemPromptForTypes(List.of(type), topicMode);
  }

  private String buildSystemPromptForTypes(List<QuestionTypeEnum> questionTypes, boolean topicMode) {
    StringBuilder sb = new StringBuilder();
    sb.append(
        """
            You are an expert English assessment item writer for a language center.
            Output ONLY valid JSON matching the envelope schema below. No markdown, no commentary.
            """);
    if (topicMode) {
      sb.append(
          "Create original, pedagogically sound content aligned with the topic brief. "
              + "Do not reference an uploaded document.\n");
    } else {
      sb.append(
          "Questions must be grounded in the provided document excerpt — do not invent facts.\n");
    }
    sb.append(
        """
            Use choiceText and correct (boolean) for choices — NOT isCorrect.
            Do NOT output tempId, selected, promptLang, difficulty, displayOrder, or choiceKey — the server fills these.

            Explanation language (mandatory for Vietnamese learners):
            - Every "explanation" field MUST be in Vietnamese (tiếng Việt), 2–4 short clear sentences.
            - Explain why the correct answer is right; for MCQ briefly note why distractors are wrong if helpful.
            - Question stems (promptText) stay in the requested promptLang (usually English).
            - NEVER use the double-quote character (") inside explanation text — use «guillemets» or single quotes for English words.
            - You may quote short English phrases from the question inside the Vietnamese explanation.

            Envelope schema:
            {
              "schemaVersion": 1,
              "questions": [ ... ],
              "meta": { "sourcePageRange": "1-N" }
            }

            """);
    for (QuestionTypeEnum type : questionTypes) {
      AiQuestionTypeHandler handler = registry.all().stream()
          .filter(h -> h.supportedType() == type)
          .findFirst()
          .orElse(null);
      if (handler == null) {
        continue;
      }
      sb.append("--- ").append(type.name()).append(" ---\n");
      sb.append(handler.promptSchemaFragment()).append('\n');
      sb.append("Example:\n").append(handler.promptExampleJson()).append("\n\n");
    }
    return sb.toString().trim();
  }

  public String buildUserPrompt(
      String excerpt,
      int questionCount,
      List<QuestionTypeEnum> questionTypes,
      int difficulty,
      String promptLang) {
    return buildUserPrompt(excerpt, questionCount, questionTypes, difficulty, promptLang, false, 4);
  }

  public String buildUserPrompt(
      String excerpt,
      int questionCount,
      List<QuestionTypeEnum> questionTypes,
      int difficulty,
      String promptLang,
      boolean topicMode,
      int readingSubQuestionCount) {
    String types = questionTypes.stream().map(Enum::name).collect(Collectors.joining(", "));
    boolean hasReading = questionTypes.stream().anyMatch(t -> t == QuestionTypeEnum.READING_COMPREHENSION);
    boolean hasGapFillMcq = questionTypes.stream().anyMatch(t -> t == QuestionTypeEnum.GAP_FILL_MCQ);
    String readingNote = "";
    String gapFillNote = "";
    if (hasReading) {
      int subs = Math.max(2, Math.min(12, readingSubQuestionCount));
      if (questionCount > 1) {
        readingNote =
            """

            READING_COMPREHENSION rules:
            - Generate exactly %d separate top-level READING_COMPREHENSION items in questions[].
            - Each item = one unique passage + exactly %d sub-questions.
            - Each passage must differ in focus or angle; do NOT merge into one item.
            - Sub-questions must be answerable from their passage only.
            """
                .formatted(questionCount, subs);
      } else {
        readingNote =
            """

            READING_COMPREHENSION rules:
            - Generate exactly 1 READING_COMPREHENSION item with %d sub-questions.
            - Sub-questions must be answerable from the passage only.
            """
                .formatted(subs);
      }
    }
    if (hasGapFillMcq) {
      int blanks = Math.max(MIN_GAP_BLANKS, Math.min(MAX_GAP_BLANKS, readingSubQuestionCount));
      gapFillNote =
          """

          GAP_FILL_MCQ rules:
          - Generate exactly 1 GAP_FILL_MCQ item in questions[] (one cloze passage).
          - promptText = full passage with exactly %d blank placeholders "___".
          - contentJson.blanks must have exactly %d entries; each with 4 choices (A/B/C/D style).
          - Use source material — do NOT convert to typed FILL_BLANK.
          """
              .formatted(blanks, blanks);
    }
    String sourceLabel;
    if (VocabularySetAiContextService.isVocabularySetExcerpt(excerpt)) {
      sourceLabel = "Vocabulary set";
    } else if (topicMode) {
      sourceLabel = "Topic brief";
    } else {
      sourceLabel = "Document excerpt";
    }
    return """
        %s:
        ---
        %s
        ---

        Generate exactly %d questions.
        Allowed questionTypes: %s
        Difficulty (1-5): %d
        promptLang for stems: %s
        explanation language: vi (Vietnamese — required for every explanation field)
        %s%s
        Return the full JSON envelope only.
        """
        .formatted(sourceLabel, excerpt, questionCount, types, difficulty, promptLang, readingNote, gapFillNote)
        .trim();
  }

  private static final int MIN_GAP_BLANKS = 2;
  private static final int MAX_GAP_BLANKS = 12;

  public String buildDeficitUserPrompt(
      String excerpt,
      QuestionTypeEnum type,
      int deficitCount,
      int difficulty,
      String promptLang,
      boolean topicMode,
      int readingSubQuestionCount,
      List<String> existingSummaries) {
    String base =
        buildUserPrompt(
            excerpt,
            deficitCount,
            List.of(type),
            difficulty,
            promptLang,
            topicMode,
            readingSubQuestionCount);
    if (existingSummaries == null || existingSummaries.isEmpty()) {
      return base;
    }
    String existingBlock =
        existingSummaries.stream()
            .filter(s -> s != null && !s.isBlank())
            .map(s -> "- " + s.trim())
            .collect(Collectors.joining("\n"));
    return base
        + """

        QUOTA RETRY — generate ADDITIONAL items only:
        - Already generated (%d items of type %s):
        %s
        - Do NOT duplicate the above. Generate exactly %d NEW items of type %s.
        """
            .formatted(existingSummaries.size(), type.name(), existingBlock, deficitCount, type.name());
  }

  /**
   * User prompt for one exam section — instruction distinguishes Synonyms vs Antonyms MCQ blocks.
   */
  public String buildExamSectionUserPrompt(
      String excerpt,
      int questionCount,
      QuestionTypeEnum questionType,
      int difficulty,
      String promptLang,
      int readingSubQuestionCount,
      String sectionTitle,
      String sectionInstruction) {
    String base =
        buildUserPrompt(
            excerpt,
            questionCount,
            List.of(questionType),
            difficulty,
            promptLang,
            false,
            readingSubQuestionCount);
    StringBuilder sb = new StringBuilder(base);
    if (sectionTitle != null && !sectionTitle.isBlank()) {
      sb.append("\n\nExam section title: ").append(sectionTitle.trim());
    }
    if (sectionInstruction != null && !sectionInstruction.isBlank()) {
      sb.append("\n\nSection instruction (show to students verbatim — follow strictly):\n");
      sb.append(sectionInstruction.trim());
      sb.append(
          "\n\nAll items in this batch belong ONLY to this section. "
              + "Match the section instruction (e.g. synonyms vs antonyms vs general MCQ).");
    }
    return sb.toString().trim();
  }

  /**
   * Similar-exam section — reference structure only (answers redacted). Must produce NEW content.
   */
  public String buildSimilarExamSectionUserPrompt(
      String referenceExcerpt,
      int questionCount,
      QuestionTypeEnum questionType,
      int difficulty,
      String promptLang,
      int readingSubQuestionCount,
      String sectionTitle,
      String sectionInstruction) {
    String typeName = questionType.name();
    String readingNote = "";
    String gapFillNote = "";
    if (questionType == QuestionTypeEnum.READING_COMPREHENSION) {
      int subs = Math.max(2, Math.min(12, readingSubQuestionCount));
      if (questionCount > 1) {
        readingNote =
            """

            READING_COMPREHENSION (similar exam):
            - Generate exactly %d separate READING_COMPREHENSION items (passages).
            - Each passage must be ENTIRELY NEW text — do NOT reuse sentences from the reference.
            - Each item = one unique passage + exactly %d sub-questions.
            - Match difficulty and style of the reference, not the wording.
            """
                .formatted(questionCount, subs);
      } else {
        readingNote =
            """

            READING_COMPREHENSION (similar exam):
            - Generate exactly 1 NEW passage (different topic/text from reference) + %d sub-questions.
            - Do NOT copy or paraphrase the reference passage verbatim.
            """
                .formatted(subs);
      }
    }
    if (questionType == QuestionTypeEnum.GAP_FILL_MCQ) {
      int blanks = Math.max(MIN_GAP_BLANKS, Math.min(MAX_GAP_BLANKS, readingSubQuestionCount));
      gapFillNote =
          """

          GAP_FILL_MCQ (similar exam):
          - Generate exactly 1 NEW cloze passage with %d blanks — different content from reference.
          - Same blank count and MCQ-per-blank format as reference; new vocabulary/context.
          """
              .formatted(blanks);
    }
    StringBuilder sb =
        new StringBuilder(
            """
            SIMILAR EXAM GENERATION — create a NEW section inspired by the reference below.

            CRITICAL rules:
            - Do NOT copy stems, passages, choices, or answers from the reference.
            - Keep the SAME question type, item count, difficulty, and student-facing instruction style.
            - For MCQ blocks (synonyms/antonyms/etc.), follow the section instruction strictly.
            - Reference shows structure only — correct answers were removed.

            Reference section (structure only):
            ---
            """
                + referenceExcerpt
                + """
            ---

            Generate exactly %d items of type %s.
            Difficulty (1-5): %d
            promptLang for stems: %s
            explanation language: vi (Vietnamese — required for every explanation field)
            %s%s
            Return the full JSON envelope only.
            """
                    .formatted(questionCount, typeName, difficulty, promptLang, readingNote, gapFillNote));
    if (sectionTitle != null && !sectionTitle.isBlank()) {
      sb.append("\n\nExam section title: ").append(sectionTitle.trim());
    }
    if (sectionInstruction != null && !sectionInstruction.isBlank()) {
      sb.append("\n\nSection instruction (show to students verbatim — follow strictly):\n");
      sb.append(sectionInstruction.trim());
    }
    return sb.toString().trim();
  }

  /** Generate similar question(s) from bank reference (answers redacted in excerpt). */
  public String buildSimilarBankQuestionUserPrompt(
      String referenceExcerpt,
      int questionCount,
      QuestionTypeEnum questionType,
      int difficulty,
      String promptLang,
      int readingSubQuestionCount,
      String additionalInstructions) {
    String base =
        buildSimilarExamSectionUserPrompt(
            referenceExcerpt,
            questionCount,
            questionType,
            difficulty,
            promptLang,
            readingSubQuestionCount,
            null,
            null);
    if (additionalInstructions != null && !additionalInstructions.isBlank()) {
      return base + "\n\nAdditional instructions:\n" + additionalInstructions.trim();
    }
    return base;
  }

  /** Rewrite / simplify / increase difficulty — transform one bank question. */
  public String buildRewriteBankQuestionUserPrompt(
      String referenceExcerpt,
      QuestionTypeEnum questionType,
      int difficulty,
      String promptLang,
      int readingSubQuestionCount,
      String bankAiAction) {
    String actionNote =
        switch (bankAiAction != null ? bankAiAction : "REWRITE") {
          case "SIMPLIFY" ->
              """
              SIMPLIFY mode:
              - Use simpler vocabulary and shorter sentences.
              - Keep the same question type and learning objective.
              - Reduce cognitive load while preserving a valid correct answer.
              """;
          case "INCREASE_DIFFICULTY" ->
              """
              INCREASE_DIFFICULTY mode:
              - Use more advanced vocabulary or nuanced distractors.
              - Keep the same question type and topic.
              - Target higher difficulty without changing promptLang.
              """;
          default ->
              """
              REWRITE mode:
              - Rephrase stem and choices (or passage/blanks) while keeping the same skill and topic.
              - Produce a fresh version — not a trivial synonym swap of every word.
              """;
        };

    String readingNote = "";
    if (questionType == QuestionTypeEnum.READING_COMPREHENSION) {
      int subs = Math.max(2, Math.min(12, readingSubQuestionCount));
      readingNote =
          """

          READING_COMPREHENSION rewrite:
          - Output exactly 1 READING_COMPREHENSION item with %d sub-questions.
          - New passage text; sub-questions must match the new passage.
          """
              .formatted(subs);
    }
    if (questionType == QuestionTypeEnum.GAP_FILL_MCQ) {
      int blanks = Math.max(MIN_GAP_BLANKS, Math.min(MAX_GAP_BLANKS, readingSubQuestionCount));
      readingNote =
          """

          GAP_FILL_MCQ rewrite:
          - Output exactly 1 item with %d blanks and MCQ per blank.
          """
              .formatted(blanks);
    }

    return """
        QUESTION BANK TRANSFORM — apply to a fork copy (full reference with answers).

        %s

        Reference question (includes correct answers):
        ---
        %s
        ---

        Generate exactly 1 item of type %s.
        Difficulty (1-5): %d
        promptLang for stems: %s
        explanation language: vi (Vietnamese — required)
        %s
        Return the full JSON envelope with exactly one transformed question.
        """
        .formatted(actionNote.trim(), referenceExcerpt, questionType.name(), difficulty, promptLang, readingNote)
        .trim();
  }
}
