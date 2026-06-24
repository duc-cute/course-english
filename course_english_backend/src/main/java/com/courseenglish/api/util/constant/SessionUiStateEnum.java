package com.courseenglish.api.util.constant;

/** Derived for API response — not persisted. */
public enum SessionUiStateEnum {
    LIVE,
    UPCOMING,
    PAST,
    /** @deprecated use NEEDS_START */
    @Deprecated
    NEEDS_SETUP,
    NEEDS_START,
    WAITING_TEACHER
}
