package com.courseenglish.api.service.cache.lesson.impl;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.courseenglish.api.domain.response.ResLessonDetailDTO;
import com.courseenglish.api.service.cache.lesson.LessonCacheService;

@Service
@ConditionalOnProperty(prefix = "app.redis", name = "enabled", havingValue = "false", matchIfMissing = true)
public class NoOpLessonCacheService implements LessonCacheService {

    @Override
    public Optional<ResLessonDetailDTO> getById(UUID id) {
        return Optional.empty();
    }

    @Override
    public Optional<ResLessonDetailDTO> getBySlug(String slug) {
        return Optional.empty();
    }

    @Override
    public boolean isNotFoundCached(String slug) {
        return false;
    }

    @Override
    public void markNotFound(String slug) {
        // no-op
    }

    @Override
    public void put(ResLessonDetailDTO detail) {
        // no-op
    }

    @Override
    public void evict(UUID lessonId, String slug, UUID subjectId) {
        // no-op
    }

    @Override
    public boolean tryRebuildLock(UUID lessonId) {
        return true;
    }

    @Override
    public void releaseRebuildLock(UUID lessonId) {
        // no-op
    }
}
