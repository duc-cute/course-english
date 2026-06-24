package com.courseenglish.api.service.ai.question.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiDraftChoiceDTO {
  private String choiceKey;
  private String choiceText;
  private Boolean correct;
  private Integer displayOrder;
}
