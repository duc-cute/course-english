package com.courseenglish.api.service.ai.question;

import com.courseenglish.api.service.ai.question.dto.AiDraftQuestionDTO;
import com.courseenglish.api.service.ai.question.dto.AiQuestionGenEnvelopeDTO;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class AiQuestionGenResultValidator {

  private final AiQuestionTypeHandlerRegistry registry;

  public AiQuestionGenResultValidator(AiQuestionTypeHandlerRegistry registry) {
    this.registry = registry;
  }

  public void normalizeAndValidate(AiQuestionGenEnvelopeDTO envelope) throws IdInvalidException {
    normalizeAndValidate(envelope, "en", 2);
  }

  public void normalizeAndValidate(AiQuestionGenEnvelopeDTO envelope, String promptLang, int difficulty)
      throws IdInvalidException {
    if (envelope.getQuestions() == null) {
      envelope.setQuestions(new ArrayList<>());
    }
    assignTempIds(envelope.getQuestions());
    for (AiDraftQuestionDTO draft : envelope.getQuestions()) {
      applyDefaults(draft, promptLang, difficulty);
      if (draft.getQuestionType() == null) {
        draft.setValidationErrors(List.of("Thiếu questionType"));
        continue;
      }
      if (!registry.supports(draft.getQuestionType())) {
        draft.setValidationErrors(List.of("Loại câu hỏi không được hỗ trợ"));
        continue;
      }
      AiQuestionTypeHandler handler = registry.require(draft.getQuestionType());
      handler.normalize(draft);
      List<String> errors = handler.validate(draft);
      draft.setValidationErrors(errors == null ? List.of() : errors);
    }
  }

  public void assignTempIds(List<AiDraftQuestionDTO> questions) {
    if (questions == null) {
      return;
    }
    for (int i = 0; i < questions.size(); i++) {
      questions.get(i).setTempId("q" + (i + 1));
    }
  }

  public int countValid(List<AiDraftQuestionDTO> questions) {
    if (questions == null || questions.isEmpty()) {
      return 0;
    }
    int valid = 0;
    for (AiDraftQuestionDTO draft : questions) {
      if (draft.getValidationErrors() == null || draft.getValidationErrors().isEmpty()) {
        valid++;
      }
    }
    return valid;
  }

  public Map<QuestionTypeEnum, Integer> countValidByType(List<AiDraftQuestionDTO> questions) {
    if (questions == null || questions.isEmpty()) {
      return Map.of();
    }
    Map<QuestionTypeEnum, Integer> counts = new HashMap<>();
    for (AiDraftQuestionDTO draft : questions) {
      if (draft.getValidationErrors() != null && !draft.getValidationErrors().isEmpty()) {
        continue;
      }
      if (draft.getQuestionType() == null) {
        continue;
      }
      counts.merge(draft.getQuestionType(), 1, Integer::sum);
    }
    return counts;
  }

  private static void applyDefaults(AiDraftQuestionDTO draft, String promptLang, int difficulty) {
    draft.setSelected(true);
    if (draft.getPromptLang() == null || draft.getPromptLang().isBlank()) {
      draft.setPromptLang(promptLang != null && !promptLang.isBlank() ? promptLang : "en");
    }
    if (draft.getDifficulty() == null) {
      draft.setDifficulty(difficulty);
    }
  }
}
