package com.courseenglish.api.service.ai.question.dto;

import com.courseenglish.api.util.constant.QuestionTypeEnum;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AiQuestionGenMetaDTO {
  private String sourcePageRange;
  private String model;
  private List<QuestionTypeEnum> requestedTypes;
  private Integer requestedCount;
  private Integer validCount;
  private Integer invalidCount;
  private String generationMode;
  private Integer batchCount;
  private String summaryMessage;
}
