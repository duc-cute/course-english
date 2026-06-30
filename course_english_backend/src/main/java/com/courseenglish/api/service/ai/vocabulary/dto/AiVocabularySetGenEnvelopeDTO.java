package com.courseenglish.api.service.ai.vocabulary.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class AiVocabularySetGenEnvelopeDTO {
  private int schemaVersion = 1;
  private String title;
  private String description;
  private String coverImagePrompt;
  /** Public path e.g. /storage/vocabulary-sets/covers/{id}.png — set after image-gen. */
  private String coverImageUrl;
  private List<AiVocabularySetItemDTO> items = new ArrayList<>();
  private AiVocabularySetGenMetaDTO meta;
}
