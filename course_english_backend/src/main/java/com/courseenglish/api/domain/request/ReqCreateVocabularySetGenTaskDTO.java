package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqCreateVocabularySetGenTaskDTO {

  @NotBlank(message = "Chủ đề / mô tả bộ từ không được để trống")
  @Size(max = 500)
  private String topicPrompt;

  @Size(max = 32)
  private String languageLevel;

  @Min(5)
  @Max(50)
  private int wordCount = 20;

  @Size(max = 255)
  private String titleHint;

  @Size(max = 2000)
  private String additionalInstructions;

  /** When true (default), generate cover via image-gen after text JSON. */
  private boolean generateCover = true;
}
