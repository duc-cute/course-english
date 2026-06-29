package com.courseenglish.api.domain.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ReqExamSectionSlicesDTO {

  @NotNull
  private UUID documentId;

  @NotEmpty
  @Valid
  private List<ExamSectionGenSpecDTO> sections = new ArrayList<>();
}
