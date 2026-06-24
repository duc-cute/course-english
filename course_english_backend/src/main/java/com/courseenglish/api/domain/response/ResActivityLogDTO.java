package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResActivityLogDTO {
  private UUID id;
  private String severity;
  private String module;
  private String action;
  private String message;
  private String detail;
  private String contextJson;
  private String refType;
  private UUID refId;
  private String httpMethod;
  private String requestPath;
  private Integer httpStatus;
  private UUID userId;
  private Instant occurredAt;
  private Instant createdAt;
}
