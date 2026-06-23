package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqSendAiMessageDTO {
    @NotBlank(message = "content is required")
    private String content;
}
