package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.QuestionTypeEnum;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResPromptBatchPreviewDTO {
  private QuestionTypeEnum questionType;
  private int count;
  private String systemPrompt;
  private String userPrompt;
}
