package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqStoryAiPreviewDTO {

    @NotBlank(message = "prompt is required")
    private String prompt;

    private String level = "A2";
    private Integer readingTimeMinutes = 5;
    private UUID vocabularySetId;
}
