package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqExamPaperOutlineDTO {

  @NotNull
  private UUID documentId;
}
