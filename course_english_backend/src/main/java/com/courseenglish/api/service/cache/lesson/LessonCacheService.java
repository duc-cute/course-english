package com.courseenglish.api.service.cache.lesson;

import java.util.Optional;
import java.util.UUID;

import com.courseenglish.api.domain.response.ResLessonDetailDTO;

public interface LessonCacheService {

    Optional<ResLessonDetailDTO> getById(UUID id);

    Optional<ResLessonDetailDTO> getBySlug(String slug);

    boolean isNotFoundCached(String slug);

    void markNotFound(String slug);

    void put(ResLessonDetailDTO detail);

    void evict(UUID lessonId, String slug, UUID subjectId);

    boolean tryRebuildLock(UUID lessonId);

    void releaseRebuildLock(UUID lessonId);
}
