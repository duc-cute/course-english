package com.courseenglish.api.service.ai.vocabulary.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiVocabularySetItemDTO {
  private String wordEn;
  private String meaningVi;
  private String phonetic;
  private String partOfSpeech;
  private String exampleSentence;
}
