package com.courseenglish.api.util.catalogimport;

import java.util.Locale;

public enum CatalogImportType {
    USERS,
    ROLES,
    CLASSROOMS,
    SUBJECTS,
    ENROLLMENTS;

    public static CatalogImportType fromPath(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Loai import khong hop le");
        }
        return CatalogImportType.valueOf(raw.trim().toUpperCase(Locale.ROOT));
    }
}
