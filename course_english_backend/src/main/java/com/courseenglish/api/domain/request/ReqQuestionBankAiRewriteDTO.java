package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.QuestionBankAiActionEnum;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqQuestionBankAiRewriteDTO {

  @NotNull
  private QuestionBankAiActionEnum mode;
}
