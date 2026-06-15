package com.courseenglish.api.service.cache.lesson.impl;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.courseenglish.api.cache.CacheKeyNames;
import com.courseenglish.api.cache.RedisCacheOperations;
import com.courseenglish.api.config.RedisProperties;
import com.courseenglish.api.domain.response.ResLessonDetailDTO;
import com.courseenglish.api.service.cache.lesson.LessonCacheService;
import com.courseenglish.api.util.constant.LessonStatusEnum;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;

@Service
@ConditionalOnProperty(prefix = "app.redis", name = "enabled", havingValue = "true")
public class LessonCacheServiceImpl implements LessonCacheService {

    private static final Logger log = LoggerFactory.getLogger(LessonCacheServiceImpl.class);
    private static final String NULL_MARKER = "1";

    private final RedisCacheOperations cache;
    private final RedisProperties props;
    private final ObjectMapper objectMapper;

    public LessonCacheServiceImpl(
            RedisCacheOperations cache,
            RedisProperties props,
            ObjectMapper objectMapper) {
        this.cache = cache;
        this.props = props;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void initKeyPrefix() {
        CacheKeyNames.setPrefix(props.getKeyPrefix());
    }

    @Override
    public Optional<ResLessonDetailDTO> getById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        return readDetail(CacheKeyNames.lessonDetailById(id), "id=" + id);
    }

    @Override
    public Optional<ResLessonDetailDTO> getBySlug(String slug) {
        if (slug == null || slug.isBlank()) {
            return Optional.empty();
        }
        return readDetail(CacheKeyNames.lessonDetailBySlug(slug), "slug=" + slug);
    }

    @Override
    public boolean isNotFoundCached(String slug) {
        if (slug == null || slug.isBlank()) {
            return false;
        }
        return cache.getRaw(CacheKeyNames.lessonNotFoundBySlug(slug)).isPresent();
    }

    @Override
    public void markNotFound(String slug) {
        if (slug == null || slug.isBlank()) {
            return;
        }
        cache.setRaw(
                CacheKeyNames.lessonNotFoundBySlug(slug),
                NULL_MARKER,
                Duration.ofSeconds(props.getNullCacheTtlSeconds()));
    }

    @Override
    public void put(ResLessonDetailDTO detail) {
        if (detail == null || detail.getId() == null || detail.getStatus() != LessonStatusEnum.PUBLISHED) {
            return;
        }
        String json;
        try {
            json = objectMapper.writeValueAsString(detail);
        } catch (JsonProcessingException ex) {
            log.warn("Skip lesson cache put id={}: {}", detail.getId(), ex.getMessage());
            return;
        }
        Duration ttl = Duration.ofSeconds(props.getLessonDetailTtlSeconds());
        cache.setRaw(CacheKeyNames.lessonDetailById(detail.getId()), json, ttl);
        if (detail.getSlug() != null && !detail.getSlug().isBlank()) {
            cache.setRaw(CacheKeyNames.lessonDetailBySlug(detail.getSlug()), json, ttl);
            cache.delete(CacheKeyNames.lessonNotFoundBySlug(detail.getSlug()));
        }
        log.debug("lesson cache PUT id={} slug={}", detail.getId(), detail.getSlug());
    }

    @Override
    public void evict(UUID lessonId, String slug, UUID subjectId) {
        if (lessonId != null) {
            cache.delete(CacheKeyNames.lessonDetailById(lessonId));
            cache.delete(CacheKeyNames.lessonRebuildLock(lessonId));
        }
        if (slug != null && !slug.isBlank()) {
            cache.delete(CacheKeyNames.lessonDetailBySlug(slug));
            cache.delete(CacheKeyNames.lessonNotFoundBySlug(slug));
        }
        log.debug("lesson cache EVICT id={} slug={} subjectId={}", lessonId, slug, subjectId);
    }

    @Override
    public boolean tryRebuildLock(UUID lessonId) {
        if (lessonId == null) {
            return true;
        }
        return cache.tryLock(
                CacheKeyNames.lessonRebuildLock(lessonId),
                Duration.ofSeconds(props.getLockTtlSeconds()));
    }

    @Override
    public void releaseRebuildLock(UUID lessonId) {
        if (lessonId == null) {
            return;
        }
        cache.unlock(CacheKeyNames.lessonRebuildLock(lessonId));
    }

    private Optional<ResLessonDetailDTO> readDetail(String key, String label) {
        Optional<String> json = cache.getRaw(key);
        if (json.isEmpty()) {
            log.debug("lesson cache MISS {}", label);
            return Optional.empty();
        }
        try {
            ResLessonDetailDTO detail = objectMapper.readValue(json.get(), ResLessonDetailDTO.class);
            log.debug("lesson cache HIT {} lessonId={}", label, detail.getId());
            return Optional.of(detail);
        } catch (JsonProcessingException ex) {
            log.warn("lesson cache corrupt {} — evict: {}", label, ex.getMessage());
            cache.delete(key);
            return Optional.empty();
        }
    }
}
