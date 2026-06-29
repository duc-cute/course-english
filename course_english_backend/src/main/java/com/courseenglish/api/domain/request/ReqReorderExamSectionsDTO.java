package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ReqReorderExamSectionsDTO {

    @NotEmpty(message = "sectionIds is required")
    private List<UUID> sectionIds;
}
