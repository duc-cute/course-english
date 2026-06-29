package com.courseenglish.api.domain.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ReqCreateExamPaperGenTaskDTO {

  @NotNull
  private UUID documentId;

  @NotEmpty
  @Valid
  private List<ExamSectionGenSpecDTO> sectionSpecs;

  @Size(max = 300)
  private String examTitle;

  @Size(max = 4000)
  private String paperInstruction;

  @Min(2)
  @Max(12)
  private Integer readingSubQuestionCount = 4;

  @Min(1)
  @Max(5)
  private Integer difficulty = 2;

  private String promptLang = "en";

  private UUID conversationId;
}
