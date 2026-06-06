package com.courseenglish.api.service;

import java.util.List;
import java.util.UUID;

import com.courseenglish.api.domain.request.ReqLessonBlockDTO;
import com.courseenglish.api.domain.request.ReqReorderLessonBlocksDTO;
import com.courseenglish.api.domain.response.ResLessonBlockDTO;
import com.courseenglish.api.util.error.IdInvalidException;

public interface LessonBlockService {

    List<ResLessonBlockDTO> listByLessonId(UUID lessonId);

    ResLessonBlockDTO create(UUID lessonId, ReqLessonBlockDTO request) throws IdInvalidException;

    ResLessonBlockDTO update(UUID blockId, ReqLessonBlockDTO request) throws IdInvalidException;

    void delete(UUID blockId);

    List<ResLessonBlockDTO> reorder(UUID lessonId, ReqReorderLessonBlocksDTO request) throws IdInvalidException;
}
