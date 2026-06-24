package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.QuestionTypeEnum;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ReqCreateQuestionGenTaskDTO {

  @NotNull(message = "documentId is required")
  private UUID documentId;

  private UUID categoryId;

  @Min(1)
  @Max(50)
  private int questionCount = 10;

  @NotEmpty(message = "questionTypes is required")
  private List<QuestionTypeEnum> questionTypes;

  @Min(1)
  @Max(5)
  private Integer difficulty = 2;

  private String promptLang = "en";

  private UUID conversationId;
}
