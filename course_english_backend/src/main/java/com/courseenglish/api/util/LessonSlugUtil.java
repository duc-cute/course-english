package com.courseenglish.api.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public final class LessonSlugUtil {

    private static final int MAX_LENGTH = 64;
    private static final Pattern PARENTHESES = Pattern.compile("\\([^)]*\\)");
    private static final Pattern NON_SLUG_CHARS = Pattern.compile("[^a-z0-9]+");
    private static final Pattern DUPLICATE_HYPHENS = Pattern.compile("-+");

    private LessonSlugUtil() {
    }

    public static String slugifyTitle(String title) {
        if (title == null || title.isBlank()) {
            return "bai-hoc";
        }

        String cleaned = PARENTHESES.matcher(title).replaceAll("").trim();
        if (cleaned.isBlank()) {
            return "bai-hoc";
        }

        String ascii = Normalizer.normalize(cleaned, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);

        String slug = NON_SLUG_CHARS.matcher(ascii).replaceAll("-");
        slug = DUPLICATE_HYPHENS.matcher(slug).replaceAll("-");
        slug = trimHyphens(slug);

        if (slug.isBlank()) {
            return "bai-hoc";
        }
        if (slug.length() > MAX_LENGTH) {
            slug = trimHyphens(slug.substring(0, MAX_LENGTH));
        }
        return slug.isBlank() ? "bai-hoc" : slug;
    }

    public static String withSuffix(String baseSlug, int suffix) {
        String suffixPart = "-" + suffix;
        int maxBase = MAX_LENGTH - suffixPart.length();
        String trimmedBase = baseSlug.length() <= maxBase ? baseSlug : trimHyphens(baseSlug.substring(0, maxBase));
        if (trimmedBase.isBlank()) {
            trimmedBase = "bai-hoc";
        }
        return trimmedBase + suffixPart;
    }

    private static String trimHyphens(String value) {
        int start = 0;
        int end = value.length();
        while (start < end && value.charAt(start) == '-') {
            start++;
        }
        while (end > start && value.charAt(end - 1) == '-') {
            end--;
        }
        return value.substring(start, end);
    }
}
