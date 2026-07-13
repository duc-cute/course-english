package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqVocabularyJourneyDTO {

    @NotBlank(message = "title is required")
    private String title;

    private String description;
    private String coverImageUrl;
    private String status;
    private Integer displayOrder;
}
