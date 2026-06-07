package com.courseenglish.api.util.constant;

public enum LessonBlockTypeEnum {
    TEXT,
    IMAGE,
    VIDEO,
    AUDIO,
    CALLOUT,
    SUMMARY,
    /** Tab Bài học — ref bộ từ vựng, resolve items lúc đọc lesson */
    VOCABULARY,
    QUESTION_REF,
    /** Gom nhiều câu luyện tập (MCQ, matching…) — payload questions[] */
    EXERCISE_SET
}
