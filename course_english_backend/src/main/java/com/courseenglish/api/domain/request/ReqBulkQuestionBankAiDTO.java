package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.QuestionBankAiActionEnum;
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
public class ReqBulkQuestionBankAiDTO {

  @NotEmpty
  @Size(max = 20)
  private List<UUID> ids;

  @NotNull
  private QuestionBankAiActionEnum action;

  @Min(1)
  @Max(3)
  private int questionCount = 1;
}
