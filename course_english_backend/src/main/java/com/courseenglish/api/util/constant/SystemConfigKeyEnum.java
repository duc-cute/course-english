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
    VOCABULARY_PRACTICE_MAX_QUESTIONS(
            "VOCABULARY_PRACTICE_MAX_QUESTIONS",
            "16",
            "Số câu tối đa mỗi session luyện từ vựng (1–40, mặc định 16)"),
    VOCABULARY_PRACTICE_PASS_SCORE(
            "VOCABULARY_PRACTICE_PASS_SCORE",
            "80",
            "Ngưỡng đạt (%) luyện từ vựng (1–100, mặc định 80)"),
    STUDENT_SELF_REGISTRATION_ENABLED(
            "STUDENT_SELF_REGISTRATION_ENABLED",
            "true",
            "Cho phép học sinh tự đăng ký tài khoản (true/1=bật)"),
    NOTIFICATION_EMAIL_ENABLED(
            "NOTIFICATION_EMAIL_ENABLED",
            "false",
            "Gửi email cho HS khi GV publish bài học / gán đề thi (true/1=bật, cần cấu hình SMTP)"),
    BRAND_NAME(
            "BRAND_NAME",
            "MT English",
            "Tên thương hiệu hiển thị trên app, email và thông báo (ví dụ: MT English)"),
    WORD_EXPORT_LOGO_URL(
            "WORD_EXPORT_LOGO_URL",
            "",
            "URL logo hiển thị đầu trang 1 khi xuất Word bài tập (PNG/JPG, upload qua Cấu hình hệ thống)"),
    WORD_EXPORT_WATERMARK_TEXT(
            "WORD_EXPORT_WATERMARK_TEXT",
            "",
            "Chữ watermark in chìm trên file đề Word (vd: Ms Mitra). Để trống = không watermark"),

    // --- AI: Vocabulary set generation / cover image (ops knobs) ---
    // Note: API keys / secrets MUST remain in .env, not SystemConfig.
    // These values are safe to edit in admin config UI.
    // Models are NOT automatically changed by code — changes should be deliberate.
    AI_VOCAB_SET_GEN_MODEL(
            "AI_VOCAB_SET_GEN_MODEL",
            "openrouter/owl-alpha",
            "Model sinh bộ từ vựng (text). Ví dụ: openrouter/owl-alpha, anthropic/claude-3.5-sonnet"),
    AI_VOCAB_SET_GEN_TIMEOUT_SEC(
            "AI_VOCAB_SET_GEN_TIMEOUT_SEC",
            "120",
            "Timeout (giây) cho AI sinh bộ từ (text)"),
    AI_VOCAB_SET_COVER_IMAGE_ENABLED(
            "AI_VOCAB_SET_COVER_IMAGE_ENABLED",
            "true",
            "Bật sinh ảnh cover bộ từ khi generateCover=true (true/1=bật, false/0=tắt)"),
    AI_VOCAB_SET_COVER_IMAGE_MODEL(
            "AI_VOCAB_SET_COVER_IMAGE_MODEL",
            "black-forest-labs/flux.2-klein-4b",
            "Model sinh ảnh cover (image). Ví dụ: black-forest-labs/flux.2-klein-4b, black-forest-labs/flux.2-max"),
    AI_VOCAB_SET_COVER_IMAGE_TIMEOUT_SEC(
            "AI_VOCAB_SET_COVER_IMAGE_TIMEOUT_SEC",
            "90",
            "Timeout (giây) cho image-gen cover"),
    AI_VOCAB_SET_COVER_IMAGE_DAILY_LIMIT(
            "AI_VOCAB_SET_COVER_IMAGE_DAILY_LIMIT",
            "15",
            "Giới hạn số ảnh cover/ngày (toàn hệ thống). 0 hoặc <0 = không giới hạn"),
    AI_STORY_ILLUSTRATION_MODEL(
            "AI_STORY_ILLUSTRATION_MODEL",
            "black-forest-labs/flux.2-klein-4b",
            "Model sinh ảnh storybook scenes / character sheets"),
    AI_STORY_ILLUSTRATION_TIMEOUT_SEC(
            "AI_STORY_ILLUSTRATION_TIMEOUT_SEC",
            "180",
            "Timeout (giây) cho sinh ảnh storybook (có thể kèm reference)");

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
