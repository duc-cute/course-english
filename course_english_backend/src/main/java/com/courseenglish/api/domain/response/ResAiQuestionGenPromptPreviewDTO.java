package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ResAiQuestionGenPromptPreviewDTO {
  private String sourceExcerpt;
  private boolean topicMode;
  private int totalQuestionCount;
  private List<ResPromptBatchPreviewDTO> batches = new ArrayList<>();
}
