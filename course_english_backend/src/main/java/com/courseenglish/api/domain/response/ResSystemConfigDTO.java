package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResSystemConfigDTO {
    private UUID id;
    private String configKey;
    private String configValue;
    private String note;
    private Instant createdAt;
    private Instant updatedAt;
}
