package com.courseenglish.api.util;

import com.courseenglish.api.util.constant.VocabularyAudioAccentEnum;

/**
 * Runtime flags loaded from {@code system_configs} via {@code SystemConfigService#initConfig()}.
 */
public final class AppConstants {

    private AppConstants() {
    }

    public static boolean dictionaryEnrichEnabled = true;
    public static boolean vocabularyAudioEnabled = true;
    public static VocabularyAudioAccentEnum vocabularyAudioAccent = VocabularyAudioAccentEnum.UK;
    public static boolean studentSelfRegistrationEnabled = true;
    public static boolean notificationEmailEnabled = false;
    /** Public URL — logo header xuất Word bài tập */
    public static String wordExportLogoUrl = "";
    /** Watermark text trên file đề Word (có thể rỗng) */
    public static String wordExportWatermarkText = "";

    // --- AI: Vocabulary set generation / cover image (loaded from system_configs) ---
    public static String aiVocabSetGenModel = "openrouter/owl-alpha";
    public static long aiVocabSetGenTimeoutSec = 120;

    public static boolean aiVocabSetCoverImageEnabled = true;
    public static String aiVocabSetCoverImageModel = "black-forest-labs/flux.2-max";
    public static long aiVocabSetCoverImageTimeoutSec = 90;
    public static long aiVocabSetCoverImageDailyLimit = 15;
}
