package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.AiDocumentStatusEnum;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResAiDocumentDTO {
  private UUID id;
  private String fileName;
  private String mimeType;
  private AiDocumentStatusEnum status;
  private Integer pageCount;
  private String errorMessage;
}
