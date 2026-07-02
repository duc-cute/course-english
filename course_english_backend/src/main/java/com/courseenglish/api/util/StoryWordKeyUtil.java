package com.courseenglish.api.util;

import java.util.Locale;
import java.util.regex.Pattern;

public final class StoryWordKeyUtil {

    private static final Pattern EDGE_PUNCTUATION = Pattern.compile("^[^a-zA-Z0-9']+|[^a-zA-Z0-9']+$");

    private StoryWordKeyUtil() {
    }

    /**
     * Strip leading/trailing punctuation then lower(trim) for vocabulary match.
     */
    public static String toWordKey(String surface) {
        if (surface == null) {
            return "";
        }
        String stripped = EDGE_PUNCTUATION.matcher(surface.trim()).replaceAll("");
        return stripped.toLowerCase(Locale.ROOT);
    }

    public static boolean isWordSurface(String surface) {
        return surface != null && !toWordKey(surface).isBlank();
    }
}
