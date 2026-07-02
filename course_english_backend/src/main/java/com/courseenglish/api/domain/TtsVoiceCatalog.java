package com.courseenglish.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "tts_voice_catalog")
@Getter
@Setter
public class TtsVoiceCatalog extends BaseObject {

    @Column(nullable = false, length = 32)
    private String provider;

    @Column(name = "voice_id", nullable = false, length = 128)
    private String voiceId;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "profile_key", length = 64)
    private String profileKey;

    @Column(length = 16)
    private String gender;

    @Column(name = "age_group", length = 16)
    private String ageGroup;

    @Column(nullable = false)
    private Integer priority = 100;

    @Column(nullable = false)
    private boolean active = true;

    @Column(length = 512)
    private String notes;
}
