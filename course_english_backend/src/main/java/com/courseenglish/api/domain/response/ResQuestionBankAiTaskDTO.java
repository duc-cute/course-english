package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.AiTaskStatusEnum;
import com.courseenglish.api.util.constant.QuestionBankAiActionEnum;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResQuestionBankAiTaskDTO {
  private UUID taskId;
  private AiTaskStatusEnum status;
  private UUID sourceQuestionId;
  /** Fork copy for REWRITE / SIMPLIFY / INCREASE_DIFFICULTY — apply AI result here. */
  private UUID targetQuestionId;
  private QuestionBankAiActionEnum action;
}
