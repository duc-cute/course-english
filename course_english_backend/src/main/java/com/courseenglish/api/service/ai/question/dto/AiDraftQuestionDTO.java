package com.courseenglish.api.service.ai.question.dto;

import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class AiDraftQuestionDTO {
  private String tempId;
  private boolean selected = true;
  private List<String> validationErrors = new ArrayList<>();
  private QuestionTypeEnum questionType;
  private String promptText;
  private String promptLang;
  private String explanation;
  private Integer difficulty;
  private List<AiDraftChoiceDTO> choices;
  private JsonNode contentJson;
}
