package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqQuestionBankAiSimilarDTO {

  @Min(1)
  @Max(5)
  private int questionCount = 1;

  @Size(max = 2000)
  private String additionalInstructions;
}
