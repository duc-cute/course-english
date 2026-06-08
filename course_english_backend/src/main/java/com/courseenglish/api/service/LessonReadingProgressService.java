package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqUpsertLessonReadingProgressDTO;
import com.courseenglish.api.domain.response.ResLessonReadingProgressDTO;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.UUID;

public interface LessonReadingProgressService {

    ResLessonReadingProgressDTO upsert(UUID lessonId, ReqUpsertLessonReadingProgressDTO request)
            throws IdInvalidException;

    ResLessonReadingProgressDTO getByLesson(UUID lessonId) throws IdInvalidException;

    ResLessonReadingProgressDTO getContinue() throws IdInvalidException;
}
