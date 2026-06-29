package com.courseenglish.api.service.ai;

import com.courseenglish.api.util.constant.QuestionTypeEnum;

/** Per-section metadata for exam-paper generation activity logs. */
public record ExamSectionLogInfo(
    int sectionIndex,
    int sectionTotal,
    String sectionTitle,
    String sectionInstruction,
    QuestionTypeEnum questionType,
    int questionCount,
    int readingSubQuestionCount) {}
