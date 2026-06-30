package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResQuestionAiExplainDTO {

  private UUID questionId;
  private String explanation;
  private String previousExplanation;
  private String explanationLang;
  private String model;
  private Integer durationMs;
}
