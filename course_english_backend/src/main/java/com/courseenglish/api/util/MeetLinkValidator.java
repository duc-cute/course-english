package com.courseenglish.api.util;

import java.net.URI;
import java.util.Locale;
import java.util.regex.Pattern;

/** Validates Google Meet / Zoom URLs for class_sessions.meet_link. */
public final class MeetLinkValidator {

    private static final Pattern MEET_HOST = Pattern.compile("^(\\w+\\.)?meet\\.google\\.com$", Pattern.CASE_INSENSITIVE);
    private static final Pattern ZOOM_HOST = Pattern.compile("^(\\w+\\.)?zoom\\.us$", Pattern.CASE_INSENSITIVE);

    private MeetLinkValidator() {
    }

    public static boolean isValid(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        try {
            URI uri = URI.create(url.trim());
            if (!"https".equalsIgnoreCase(uri.getScheme())) {
                return false;
            }
            String host = uri.getHost();
            if (host == null) {
                return false;
            }
            String normalizedHost = host.toLowerCase(Locale.ROOT);
            if ("meet.new".equals(normalizedHost)) {
                return false;
            }
            return MEET_HOST.matcher(normalizedHost).matches() || ZOOM_HOST.matcher(normalizedHost).matches();
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    public static String requireValid(String url) {
        String trimmed = url == null ? "" : url.trim();
        if (!isValid(trimmed)) {
            throw new IllegalArgumentException(
                    "Link không hợp lệ. Chỉ chấp nhận Google Meet (meet.google.com) hoặc Zoom (zoom.us).");
        }
        return trimmed;
    }
}
