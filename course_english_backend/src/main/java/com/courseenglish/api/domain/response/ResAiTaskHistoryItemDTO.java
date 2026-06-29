package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.AiTaskStatusEnum;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResAiTaskHistoryItemDTO {
  private UUID id;
  private AiTaskStatusEnum status;
  private String taskType;
  private Instant createdAt;
  private String topic;
  private Integer questionCount;
  private Integer validCount;
  private String summaryMessage;
  private String label;
}
