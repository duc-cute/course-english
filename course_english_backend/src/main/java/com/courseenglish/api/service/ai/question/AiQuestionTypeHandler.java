package com.courseenglish.api.service.ai.question;

import com.courseenglish.api.service.ai.question.dto.AiDraftQuestionDTO;
import com.courseenglish.api.util.constant.QuestionTypeEnum;

import java.util.List;

public interface AiQuestionTypeHandler {

  QuestionTypeEnum supportedType();

  String promptSchemaFragment();

  String promptExampleJson();

  void normalize(AiDraftQuestionDTO draft);

  List<String> validate(AiDraftQuestionDTO draft);
}
