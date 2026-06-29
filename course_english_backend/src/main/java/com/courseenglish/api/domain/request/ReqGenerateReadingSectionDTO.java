package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ReqGenerateReadingSectionDTO {

  @NotBlank
  @Size(min = 8, max = 2000)
  private String prompt;

  /** Sub-question count per passage, e.g. [5,3,4]. Defaults to one passage with 4 sub-questions. */
  private List<@Min(2) @Max(12) Integer> subQuestionCounts;

  @Min(1)
  @Max(5)
  private Integer difficulty = 2;

  private String promptLang = "en";

  @Min(1)
  @Max(12)
  private Integer grade;

  @Size(max = 32)
  private String languageLevel;

  @Size(max = 4000)
  private String sectionInstruction;
}
