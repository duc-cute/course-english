package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.AiTaskStatusEnum;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResAiTaskDTO {
  private UUID id;
  private AiTaskStatusEnum status;
  private String taskType;
  private JsonNode outputJson;
  private String errorMessage;
  private String model;
}
