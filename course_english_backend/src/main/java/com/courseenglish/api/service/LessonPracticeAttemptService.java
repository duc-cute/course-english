package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqCreateLessonPracticeAttemptDTO;
import com.courseenglish.api.domain.request.ReqLessonPracticeSummaryDTO;
import com.courseenglish.api.domain.response.ResLessonPracticeAttemptDTO;
import com.courseenglish.api.domain.response.ResLessonPracticeSummaryItemDTO;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.List;
import java.util.UUID;

public interface LessonPracticeAttemptService {

    ResLessonPracticeAttemptDTO create(ReqCreateLessonPracticeAttemptDTO request) throws IdInvalidException;

    ResLessonPracticeAttemptDTO getLatest(UUID lessonId) throws IdInvalidException;

    ResLessonPracticeAttemptDTO getBest(UUID lessonId) throws IdInvalidException;

    List<ResLessonPracticeAttemptDTO> listByLesson(UUID lessonId) throws IdInvalidException;

    List<ResLessonPracticeSummaryItemDTO> getSummary(ReqLessonPracticeSummaryDTO request) throws IdInvalidException;
}
