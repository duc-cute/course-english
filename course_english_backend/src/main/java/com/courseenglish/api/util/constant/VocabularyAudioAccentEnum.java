package com.courseenglish.api.util.constant;

import lombok.Getter;

@Getter
public enum VocabularyAudioAccentEnum {
    UK("UK"),
    US("US"),
    BOTH("BOTH");

    private final String value;

    VocabularyAudioAccentEnum(String value) {
        this.value = value;
    }

    public static VocabularyAudioAccentEnum fromValue(String raw, VocabularyAudioAccentEnum defaultValue) {
        if (raw == null || raw.isBlank()) {
            return defaultValue;
        }
        String normalized = raw.trim().toUpperCase();
        for (VocabularyAudioAccentEnum item : values()) {
            if (item.value.equals(normalized)) {
                return item;
            }
        }
        return defaultValue;
    }
}
