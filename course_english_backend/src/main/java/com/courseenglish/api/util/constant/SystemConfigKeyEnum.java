package com.courseenglish.api.util.constant;

import lombok.Getter;

@Getter
public enum SystemConfigKeyEnum {

    DICTIONARY_ENRICH_ENABLED(
            "DICTIONARY_ENRICH_ENABLED",
            "true",
            "Bật tra cứu Free Dictionary khi enrich từ vựng (true/1=bật, false/0=tắt)"),
    VOCABULARY_AUDIO_ENABLED(
            "VOCABULARY_AUDIO_ENABLED",
            "true",
            "Hiển thị nút phát âm cho học sinh (true/1=bật)"),
    VOCABULARY_AUDIO_ACCENT(
            "VOCABULARY_AUDIO_ACCENT",
            "UK",
            "Giọng phát âm hiển thị cho học sinh: UK | US | BOTH (mặc định UK)"),
    STUDENT_SELF_REGISTRATION_ENABLED(
            "STUDENT_SELF_REGISTRATION_ENABLED",
            "true",
            "Cho phép học sinh tự đăng ký tài khoản (true/1=bật)");

    private final String key;
    private final String defaultValue;
    private final String defaultNote;

    SystemConfigKeyEnum(String key, String defaultValue, String defaultNote) {
        this.key = key;
        this.defaultValue = defaultValue;
        this.defaultNote = defaultNote;
    }

    public static SystemConfigKeyEnum fromKey(String key) {
        if (key == null || key.isBlank()) {
            return null;
        }
        String normalized = key.trim().toUpperCase();
        for (SystemConfigKeyEnum item : values()) {
            if (item.key.equals(normalized)) {
                return item;
            }
        }
        return null;
    }
}
