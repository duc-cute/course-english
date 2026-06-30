package com.courseenglish.api.service.ai.question;

import com.courseenglish.api.domain.response.ResQuestionChoiceDTO;
import com.courseenglish.api.domain.response.ResQuestionAiExplainDTO;
import com.courseenglish.api.domain.response.ResQuestionDTO;
import com.courseenglish.api.service.QuestionService;
import com.courseenglish.api.service.ai.AiAccessSupport;
import com.courseenglish.api.service.impl.OpenRouterClient;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class QuestionAiExplainService {

  private static final Set<QuestionTypeEnum> SUPPORTED =
      Set.of(
          QuestionTypeEnum.MULTIPLE_CHOICE,
          QuestionTypeEnum.TRUE_FALSE,
          QuestionTypeEnum.FILL_BLANK);

  private final QuestionService questionService;
  private final AiAccessSupport aiAccessSupport;
  private final OpenRouterClient openRouterClient;
  private final ObjectMapper objectMapper;

  @Value("${app.ai.question-explain-model:${app.ai.default-chat-model}}")
  private String explainModel;

  public QuestionAiExplainService(
      QuestionService questionService,
      AiAccessSupport aiAccessSupport,
      OpenRouterClient openRouterClient,
      ObjectMapper objectMapper) {
    this.questionService = questionService;
    this.aiAccessSupport = aiAccessSupport;
    this.openRouterClient = openRouterClient;
    this.objectMapper = objectMapper;
  }

  public ResQuestionAiExplainDTO explain(UUID questionId) throws IdInvalidException {
    aiAccessSupport.requireAiEnabled();
    aiAccessSupport.requireStaffUser();

    ResQuestionDTO question = questionService.getById(questionId);
    QuestionTypeEnum type = question.getQuestionType();
    if (type == null || !SUPPORTED.contains(type)) {
      throw new IdInvalidException("Chưa hỗ trợ giải thích AI cho loại câu: " + type);
    }

    String correctAnswerBlock = buildCorrectAnswerBlock(question);
    String systemPrompt =
        """
            You are an expert English teacher writing answer explanations for Vietnamese students.
            Write ONLY valid JSON: {"explanation": "..."}
            Rules:
            - explanation MUST be in Vietnamese (tiếng Việt).
            - 2–5 short sentences: why the correct answer is right; briefly why common wrong options are wrong if MCQ.
            - Use simple, clear Vietnamese suitable for language learners; you may quote short English phrases from the question.
            - Do NOT change the question or suggest a different correct answer.
            - No markdown, no bullet lists, plain text inside the JSON string.
            """;

    String userPrompt =
        """
            Question type: %s
            CEFR: %s
            Difficulty (1-5): %s

            Question stem:
            %s

            Correct answer:
            %s

            Return JSON only.
            """
            .formatted(
                type.name(),
                question.getCefrLevel() != null ? question.getCefrLevel() : "—",
                question.getDifficulty() != null ? question.getDifficulty() : "—",
                question.getPromptText().trim(),
                correctAnswerBlock);

    OpenRouterClient.ChatResult chat =
        openRouterClient.chatJson(
            explainModel,
            List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)),
            60,
            512);

    String explanation = parseExplanation(chat.getContent());
    if (explanation.isBlank()) {
      throw new IdInvalidException("AI không trả lời giải thích hợp lệ");
    }

    ResQuestionAiExplainDTO dto = new ResQuestionAiExplainDTO();
    dto.setQuestionId(questionId);
    dto.setExplanation(explanation);
    dto.setPreviousExplanation(question.getExplanation());
    dto.setExplanationLang("vi");
    dto.setModel(explainModel);
    dto.setDurationMs(chat.getDurationMs());
    return dto;
  }

  private String parseExplanation(String json) throws IdInvalidException {
    try {
      JsonNode root = objectMapper.readTree(json);
      String text = root.path("explanation").asText("").trim();
      if (!text.isBlank()) {
        return text;
      }
    } catch (Exception ignored) {
      // fall through
    }
    throw new IdInvalidException("AI không trả JSON explanation hợp lệ");
  }

  private String buildCorrectAnswerBlock(ResQuestionDTO question) throws IdInvalidException {
    QuestionTypeEnum type = question.getQuestionType();
    if (type == QuestionTypeEnum.MULTIPLE_CHOICE) {
      List<ResQuestionChoiceDTO> choices = question.getChoices();
      if (choices == null || choices.isEmpty()) {
        throw new IdInvalidException("Câu MCQ thiếu đáp án");
      }
      StringBuilder sb = new StringBuilder();
      for (ResQuestionChoiceDTO c : choices) {
        sb.append(c.isCorrect() ? "[CORRECT] " : "[distractor] ");
        sb.append(c.getChoiceKey()).append(": ").append(c.getChoiceText()).append('\n');
      }
      return sb.toString().trim();
    }
    if (type == QuestionTypeEnum.TRUE_FALSE) {
      Boolean correct = parseTrueFalseCorrect(question.getContentJson());
      if (correct == null) {
        throw new IdInvalidException("Câu Đúng/Sai thiếu đáp án");
      }
      return correct ? "True (Đúng)" : "False (Sai)";
    }
    if (type == QuestionTypeEnum.FILL_BLANK) {
      return formatFillBlankAnswers(question.getContentJson());
    }
    return "—";
  }

  private Boolean parseTrueFalseCorrect(String contentJson) {
    if (contentJson == null || contentJson.isBlank()) {
      return null;
    }
    try {
      JsonNode node = objectMapper.readTree(contentJson);
      if (node.has("correctAnswer") && node.get("correctAnswer").isBoolean()) {
        return node.get("correctAnswer").asBoolean();
      }
    } catch (Exception ignored) {
      return null;
    }
    return null;
  }

  private String formatFillBlankAnswers(String contentJson) throws IdInvalidException {
    if (contentJson == null || contentJson.isBlank()) {
      throw new IdInvalidException("Câu điền từ thiếu đáp án");
    }
    try {
      JsonNode node = objectMapper.readTree(contentJson);
      JsonNode blanks = node.path("blanks");
      if (!blanks.isArray() || blanks.isEmpty()) {
        throw new IdInvalidException("Câu điền từ thiếu blanks");
      }
      StringBuilder sb = new StringBuilder();
      for (int i = 0; i < blanks.size(); i++) {
        JsonNode blank = blanks.get(i);
        JsonNode accepted = blank.path("acceptedAnswers");
        if (accepted.isArray() && accepted.size() > 0) {
          sb.append("Blank ").append(i + 1).append(": ");
          for (int j = 0; j < accepted.size(); j++) {
            if (j > 0) {
              sb.append(" / ");
            }
            sb.append(accepted.get(j).asText());
          }
          sb.append('\n');
        }
      }
      String result = sb.toString().trim();
      if (result.isBlank()) {
        throw new IdInvalidException("Câu điền từ thiếu đáp án chấp nhận");
      }
      return result;
    } catch (IdInvalidException e) {
      throw e;
    } catch (Exception e) {
      throw new IdInvalidException("Không đọc được đáp án điền từ");
    }
  }
}
