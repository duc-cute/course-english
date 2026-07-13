package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqVocabularyTopicDTO {

    @NotNull(message = "journeyId is required")
    private UUID journeyId;

    @NotBlank(message = "title is required")
    private String title;

    private String slug;
    private String subtitle;
    private String coverImageUrl;
    private String themeColor;
    private String status;
    private Integer displayOrder;
}
