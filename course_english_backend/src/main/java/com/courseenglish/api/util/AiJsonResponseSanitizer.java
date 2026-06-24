package com.courseenglish.api.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Strips markdown fences and surrounding prose from LLM output before JSON parsing.
 * Used by structured generation (question gen), not chat markdown.
 */
public final class AiJsonResponseSanitizer {

    private static final Pattern FENCED_BLOCK =
            Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)```", Pattern.CASE_INSENSITIVE);

    private AiJsonResponseSanitizer() {
    }

    /**
     * @return best-effort JSON object substring, or trimmed input if no braces found
     */
    public static String extractJsonObject(String raw) {
        if (raw == null) {
            return "";
        }

        String s = raw.trim();
        if (s.isEmpty()) {
            return "";
        }

        Matcher fenced = FENCED_BLOCK.matcher(s);
        if (fenced.find()) {
            s = fenced.group(1).trim();
        } else {
            s = s.replaceAll("(?i)^```(?:json)?\\s*", "")
                    .replaceAll("\\s*```$", "")
                    .trim();
        }

        int start = s.indexOf('{');
        int end = s.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return s.substring(start, end + 1);
        }

        return s;
    }
}
