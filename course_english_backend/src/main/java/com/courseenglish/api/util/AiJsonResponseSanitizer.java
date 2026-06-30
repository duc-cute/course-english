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

    /**
     * Escapes unescaped {@code "} inside JSON string values for {@code fieldName} (e.g. explanation).
     * LLMs often output {@code "explanation": "Đáp án đúng là "goes" vì..."} which truncates at the
     * first inner quote when parsed by Jackson.
     */
    public static String repairUnescapedQuotesInField(String json, String fieldName) {
        if (json == null || json.isBlank() || fieldName == null || fieldName.isBlank()) {
            return json;
        }
        String search = "\"" + fieldName + "\"";
        StringBuilder result = new StringBuilder();
        int cursor = 0;
        while (cursor < json.length()) {
            int fieldStart = json.indexOf(search, cursor);
            if (fieldStart < 0) {
                result.append(json.substring(cursor));
                break;
            }
            result.append(json, cursor, fieldStart);
            int valueStartQuote = findStringValueOpeningQuote(json, fieldStart + search.length());
            if (valueStartQuote < 0) {
                result.append(json.substring(fieldStart));
                break;
            }
            result.append(json, fieldStart, valueStartQuote + 1);
            int j = valueStartQuote + 1;
            while (j < json.length()) {
                char c = json.charAt(j);
                if (c == '\\' && j + 1 < json.length()) {
                    result.append(c).append(json.charAt(j + 1));
                    j += 2;
                    continue;
                }
                if (c == '"') {
                    int k = j + 1;
                    while (k < json.length() && Character.isWhitespace(json.charAt(k))) {
                        k++;
                    }
                    if (k >= json.length()) {
                        result.append(c);
                        j++;
                        break;
                    }
                    char next = json.charAt(k);
                    if (next == ',' || next == '}' || next == ']') {
                        result.append(c);
                        j++;
                        break;
                    }
                    result.append('\\').append(c);
                    j++;
                    continue;
                }
                result.append(c);
                j++;
            }
            cursor = j;
        }
        return result.toString();
    }

    private static int findStringValueOpeningQuote(String json, int fromIndex) {
        int p = fromIndex;
        while (p < json.length()) {
            char c = json.charAt(p);
            if (c == '"') {
                return p;
            }
            if (c != ' ' && c != '\t' && c != '\n' && c != '\r' && c != ':') {
                return -1;
            }
            p++;
        }
        return -1;
    }
}
