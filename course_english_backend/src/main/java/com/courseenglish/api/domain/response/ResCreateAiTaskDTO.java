package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.AiTaskStatusEnum;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResCreateAiTaskDTO {
  private UUID taskId;
  private AiTaskStatusEnum status;
}
