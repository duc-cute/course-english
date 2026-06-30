package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResBulkQuestionResultDTO {

  private int requested;
  private int affected;
  private List<UUID> notFoundIds = new ArrayList<>();
  /** New question ids when operation = DUPLICATE */
  private List<UUID> createdIds = new ArrayList<>();
}
