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
}
