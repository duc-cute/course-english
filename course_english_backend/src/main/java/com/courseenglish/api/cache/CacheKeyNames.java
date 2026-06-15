package com.courseenglish.api.cache;

import java.util.UUID;

public final class CacheKeyNames {

    private static String prefix = "ce:";

    private CacheKeyNames() {
    }

    public static void setPrefix(String keyPrefix) {
        prefix = keyPrefix == null || keyPrefix.isBlank() ? "ce:" : keyPrefix;
    }

    public static String lessonDetailById(UUID id) {
        return prefix + "lesson:detail:id:" + id;
    }

    public static String lessonDetailBySlug(String slug) {
        return prefix + "lesson:detail:slug:" + slug;
    }

    public static String lessonNotFoundBySlug(String slug) {
        return prefix + "lesson:detail:null:slug:" + slug;
    }

    public static String lessonRebuildLock(UUID lessonId) {
        return prefix + "lock:lesson:" + lessonId;
    }
}
