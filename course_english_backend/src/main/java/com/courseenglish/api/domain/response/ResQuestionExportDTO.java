package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResQuestionExportDTO {

  private Instant exportedAt;
  private int requested;
  private int exported;
  private List<UUID> notFoundIds = new ArrayList<>();
  private List<ResQuestionDTO> questions = new ArrayList<>();
}
