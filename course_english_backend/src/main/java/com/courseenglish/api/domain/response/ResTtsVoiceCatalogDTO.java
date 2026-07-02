package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResTtsVoiceCatalogDTO {
    private UUID id;
    private String provider;
    private String voiceId;
    private String displayName;
    private String profileKey;
    private String gender;
    private String ageGroup;
    private Integer priority;
}
