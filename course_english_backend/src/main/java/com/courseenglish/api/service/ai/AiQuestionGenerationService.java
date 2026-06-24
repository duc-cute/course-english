package com.courseenglish.api.service.ai;

import com.courseenglish.api.service.ai.question.AiQuestionGenResultValidator;
import com.courseenglish.api.service.ai.question.AiQuestionPromptAssembler;
import com.courseenglish.api.service.ai.question.dto.AiQuestionGenEnvelopeDTO;
import com.courseenglish.api.service.ai.question.dto.AiQuestionGenMetaDTO;
import com.courseenglish.api.service.impl.OpenRouterClient;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AiQuestionGenerationService {

  private final OpenRouterClient openRouterClient;
  private final ObjectMapper objectMapper;
  private final AiQuestionPromptAssembler promptAssembler;
  private final AiQuestionGenResultValidator resultValidator;

  @Value("${app.ai.question-gen-model:anthropic/claude-3.5-sonnet}")
  private String questionGenModel;

  public AiQuestionGenerationService(
      OpenRouterClient openRouterClient,
      ObjectMapper objectMapper,
      AiQuestionPromptAssembler promptAssembler,
      AiQuestionGenResultValidator resultValidator) {
    this.openRouterClient = openRouterClient;
    this.objectMapper = objectMapper;
    this.promptAssembler = promptAssembler;
    this.resultValidator = resultValidator;
  }

  public GenerationResult generate(
      String documentExcerpt,
      int questionCount,
      List<QuestionTypeEnum> questionTypes,
      int difficulty,
      String promptLang) throws IdInvalidException {
    String system = promptAssembler.buildSystemPrompt(questionTypes);
    String user = promptAssembler.buildUserPrompt(
        documentExcerpt, questionCount, questionTypes, difficulty, promptLang);

    List<Map<String, String>> messages = List.of(
        Map.of("role", "system", "content", system),
        Map.of("role", "user", "content", user));

    OpenRouterClient.ChatResult chatResult = callWithJsonRetry(messages);
    AiQuestionGenEnvelopeDTO envelope = parseEnvelope(chatResult.getContent());

    if (envelope.getMeta() == null) {
      envelope.setMeta(new AiQuestionGenMetaDTO());
    }
    envelope.getMeta().setModel(questionGenModel);
    envelope.getMeta().setRequestedTypes(questionTypes);
    if (envelope.getQuestions() == null) {
      envelope.setQuestions(new ArrayList<>());
    }

    resultValidator.normalizeAndValidate(envelope);

    GenerationResult result = new GenerationResult();
    result.setEnvelope(envelope);
    result.setPromptTokens(chatResult.getPromptTokens());
    result.setCompletionTokens(chatResult.getCompletionTokens());
    result.setModel(questionGenModel);
    return result;
  }

  private OpenRouterClient.ChatResult callWithJsonRetry(List<Map<String, String>> messages) throws IdInvalidException {
    OpenRouterClient.ChatResult first = openRouterClient.chatJson(questionGenModel, messages);
    try {
      parseEnvelope(first.getContent());
      return first;
    } catch (IdInvalidException parseError) {
      List<Map<String, String>> retryMessages = new ArrayList<>(messages);
      retryMessages.add(Map.of(
          "role", "assistant",
          "content", first.getContent()));
      retryMessages.add(Map.of(
          "role", "user",
          "content", "Invalid JSON. Return ONLY the corrected JSON envelope. No markdown."));
      return openRouterClient.chatJson(questionGenModel, retryMessages);
    }
  }

  private AiQuestionGenEnvelopeDTO parseEnvelope(String json) throws IdInvalidException {
    try {
      return objectMapper.readValue(json, AiQuestionGenEnvelopeDTO.class);
    } catch (JsonProcessingException e) {
      throw new IdInvalidException("AI trả JSON không hợp lệ");
    }
  }

  public static class GenerationResult {
    private AiQuestionGenEnvelopeDTO envelope;
    private Integer promptTokens;
    private Integer completionTokens;
    private String model;

    public AiQuestionGenEnvelopeDTO getEnvelope() {
      return envelope;
    }

    public void setEnvelope(AiQuestionGenEnvelopeDTO envelope) {
      this.envelope = envelope;
    }

    public Integer getPromptTokens() {
      return promptTokens;
    }

    public void setPromptTokens(Integer promptTokens) {
      this.promptTokens = promptTokens;
    }

    public Integer getCompletionTokens() {
      return completionTokens;
    }

    public void setCompletionTokens(Integer completionTokens) {
      this.completionTokens = completionTokens;
    }

    public String getModel() {
      return model;
    }

    public void setModel(String model) {
      this.model = model;
    }
  }
}
