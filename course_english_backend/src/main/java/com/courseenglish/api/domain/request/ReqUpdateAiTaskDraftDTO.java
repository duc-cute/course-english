package com.courseenglish.api.domain.request;

import com.courseenglish.api.service.ai.question.dto.AiDraftQuestionDTO;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ReqUpdateAiTaskDraftDTO {

  @NotEmpty(message = "questions is required")
  private List<AiDraftQuestionDTO> questions;
}
