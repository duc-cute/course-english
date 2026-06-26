package com.courseenglish.api.service.ai.question.impl;

import com.courseenglish.api.service.ai.question.AiQuestionTypeHandler;
import com.courseenglish.api.service.ai.question.dto.AiDraftQuestionDTO;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class TrueFalseQuestionTypeHandler implements AiQuestionTypeHandler {

  @Override
  public QuestionTypeEnum supportedType() {
    return QuestionTypeEnum.TRUE_FALSE;
  }

  @Override
  public String promptSchemaFragment() {
    return """
        TRUE_FALSE:
        - contentJson: { "correctAnswer": true | false }
        - No choices array
        """;
  }

  @Override
  public String promptExampleJson() {
    return """
        {
          "questionType": "TRUE_FALSE",
          "promptText": "London is the capital of France.",
          "explanation": "Paris is the capital of France.",
          "contentJson": { "correctAnswer": false }
        }""";
  }

  @Override
  public void normalize(AiDraftQuestionDTO draft) {
    draft.setChoices(null);
  }

  @Override
  public List<String> validate(AiDraftQuestionDTO draft) {
    List<String> errors = new ArrayList<>();
    if (draft.getPromptText() == null || draft.getPromptText().isBlank()) {
      errors.add("Thiếu nội dung câu hỏi");
    }
    JsonNode node = draft.getContentJson();
    if (node == null || node.isNull() || !node.has("correctAnswer") || !node.get("correctAnswer").isBoolean()) {
      errors.add("TRUE_FALSE cần contentJson.correctAnswer (boolean)");
    }
    return errors;
  }
}
