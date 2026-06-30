package com.courseenglish.api.service.ai.vocabulary.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiVocabularySetGenMetaDTO {
  private int schemaVersion = 1;
  private String model;
  private String summaryMessage;
  private int itemCount;
}
