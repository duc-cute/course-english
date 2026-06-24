package com.courseenglish.api.service.ai.question.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class AiQuestionGenEnvelopeDTO {
  private int schemaVersion = 1;
  private List<AiDraftQuestionDTO> questions = new ArrayList<>();
  private AiQuestionGenMetaDTO meta = new AiQuestionGenMetaDTO();
}
