package com.courseenglish.api.domain.response;

import com.courseenglish.api.service.ai.question.dto.AiQuestionGenEnvelopeDTO;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ResParseReadingBlockDTO {

  private AiQuestionGenEnvelopeDTO envelope;
  private List<String> warnings = new ArrayList<>();
}

