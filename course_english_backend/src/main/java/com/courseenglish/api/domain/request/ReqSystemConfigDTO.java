package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqSystemConfigDTO {

    private UUID id;

    @NotBlank(message = "configKey is required")
    private String configKey;

    private String configValue;

    private String note;
}
