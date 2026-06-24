package com.courseenglish.api.service.ai.question;

import com.courseenglish.api.service.ai.question.dto.AiDraftQuestionDTO;
import com.courseenglish.api.service.ai.question.dto.AiQuestionGenEnvelopeDTO;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class AiQuestionGenResultValidator {

  private final AiQuestionTypeHandlerRegistry registry;

  public AiQuestionGenResultValidator(AiQuestionTypeHandlerRegistry registry) {
    this.registry = registry;
  }

  public void normalizeAndValidate(AiQuestionGenEnvelopeDTO envelope) throws IdInvalidException {
    if (envelope.getQuestions() == null) {
      envelope.setQuestions(new ArrayList<>());
    }
    for (AiDraftQuestionDTO draft : envelope.getQuestions()) {
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
      if (draft.getTempId() == null || draft.getTempId().isBlank()) {
        draft.setTempId("q" + (envelope.getQuestions().indexOf(draft) + 1));
      }
    }
  }
}
