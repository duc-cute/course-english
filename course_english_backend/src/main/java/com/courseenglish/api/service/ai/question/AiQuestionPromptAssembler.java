package com.courseenglish.api.service.ai.question;

import com.courseenglish.api.util.constant.QuestionTypeEnum;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class AiQuestionPromptAssembler {

  private final AiQuestionTypeHandlerRegistry registry;

  public AiQuestionPromptAssembler(AiQuestionTypeHandlerRegistry registry) {
    this.registry = registry;
  }

  public String buildSystemPrompt(List<QuestionTypeEnum> questionTypes) {
    StringBuilder sb = new StringBuilder();
    sb.append(
        """
            You are an expert English assessment item writer for a language center.
            Output ONLY valid JSON matching the envelope schema below. No markdown, no commentary.
            Questions must be grounded in the provided document excerpt — do not invent facts.
            Each question object uses field names exactly as shown (choiceKey, choiceText, correct — NOT isCorrect).
            Assign tempId as q1, q2, ... and selected: true for each question.

            Envelope schema:
            {
              "schemaVersion": 1,
              "questions": [ ... ],
              "meta": { "sourcePageRange": "1-N", "model": "..." }
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
    String types = questionTypes.stream().map(Enum::name).collect(Collectors.joining(", "));
    boolean hasReading = questionTypes.stream().anyMatch(t -> t == QuestionTypeEnum.READING_COMPREHENSION);
    String readingNote = hasReading
        ? """

        READING_COMPREHENSION count rule:
        - questionCount = number of top-level items in questions[].
        - Prefer 1 READING_COMPREHENSION item with 3-6 sub-questions over many separate items.
        - Use passage text from the document; sub-questions must be answerable from the passage only.
        """
        : "";
    return """
        Document excerpt:
        ---
        %s
        ---

        Generate exactly %d questions.
        Allowed questionTypes: %s
        Difficulty (1-5): %d
        promptLang for stems: %s
        %s
        Return the full JSON envelope only.
        """
        .formatted(excerpt, questionCount, types, difficulty, promptLang, readingNote)
        .trim();
  }
}
