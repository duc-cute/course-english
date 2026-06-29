package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ReqParseReadingBlockDTO {

  @Size(min = 80, max = 120000)
  private String rawText;

  /** Optional expected sub-question counts per passage, e.g. [5,3,4]. */
  private List<Integer> expectedSubQuestionCounts;
}

