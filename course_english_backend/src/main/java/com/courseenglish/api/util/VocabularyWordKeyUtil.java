package com.courseenglish.api.util;

import java.util.Locale;

public final class VocabularyWordKeyUtil {

    private VocabularyWordKeyUtil() {
    }

    /**
     * Canonical lookup key: lower(trim(word_en)).
     */
    public static String toWordKey(String wordEn) {
        if (wordEn == null) {
            return "";
        }
        return wordEn.trim().toLowerCase(Locale.ROOT);
    }

    public static String normalizeWordEn(String wordEn) {
        if (wordEn == null) {
            return "";
        }
        return wordEn.trim();
    }
}
