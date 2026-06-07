package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.VocabularySetStatusEnum;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ReqVocabularySetDTO {
    @NotBlank(message = "title is required")
    private String title;

    private String description;
    private UUID subjectId;
    private VocabularySetStatusEnum status;

    @Valid
    private List<ReqVocabularyItemDTO> items;
}
