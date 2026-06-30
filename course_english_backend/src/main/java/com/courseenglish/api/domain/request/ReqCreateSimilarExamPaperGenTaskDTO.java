package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqCreateSimilarExamPaperGenTaskDTO {

  @Size(max = 300)
  private String newExamTitle;

  @Size(max = 4000)
  private String newPaperInstruction;

  @Min(1)
  @Max(5)
  private Integer difficulty = 2;

  private String promptLang = "en";
}
