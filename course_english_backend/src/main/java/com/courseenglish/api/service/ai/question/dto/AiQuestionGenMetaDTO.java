package com.courseenglish.api.service.ai.question.dto;

import java.util.List;

import com.courseenglish.api.util.constant.QuestionTypeEnum;

import lombok.Getter;
import lombok.Setter;

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
