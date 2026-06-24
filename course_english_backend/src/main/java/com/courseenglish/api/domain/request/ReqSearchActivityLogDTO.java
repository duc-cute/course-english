package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ReqSearchActivityLogDTO extends ReqPagingSearchDTO {
  private String keyword;
  private String severity;
  private String module;
  private String action;
  private UUID userId;
  private String refType;
  private UUID refId;
  private Instant fromOccurredAt;
  private Instant toOccurredAt;
}
