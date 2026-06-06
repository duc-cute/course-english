package com.courseenglish.api.service;

import java.util.List;
import java.util.UUID;

import com.courseenglish.api.domain.request.ReqLessonAssetDTO;
import com.courseenglish.api.domain.response.ResLessonAssetDTO;
import com.courseenglish.api.util.error.IdInvalidException;

public interface LessonAssetService {

    List<ResLessonAssetDTO> listByLessonId(UUID lessonId);

    ResLessonAssetDTO create(UUID lessonId, ReqLessonAssetDTO request) throws IdInvalidException;

    void delete(UUID assetId);
}
