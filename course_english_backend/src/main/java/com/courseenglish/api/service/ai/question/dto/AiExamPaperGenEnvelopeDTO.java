package com.courseenglish.api.service.ai.question.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class AiExamPaperGenEnvelopeDTO {

  private int schemaVersion = 1;
  private String examTitle;
  private String paperInstruction;
  private List<AiExamPaperGenSectionDTO> sections = new ArrayList<>();
  private AiQuestionGenMetaDTO meta;
}
