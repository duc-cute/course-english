package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResBulkQuestionBankAiDTO {
  private int requested;
  private List<UUID> taskIds = new ArrayList<>();
  private List<BulkAiError> errors = new ArrayList<>();

  @Getter
  @Setter
  public static class BulkAiError {
    private UUID questionId;
    private String message;
  }
}
