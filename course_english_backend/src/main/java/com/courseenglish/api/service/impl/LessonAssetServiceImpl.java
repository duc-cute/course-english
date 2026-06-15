package com.courseenglish.api.service.impl;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.courseenglish.api.domain.Lesson;
import com.courseenglish.api.domain.LessonAsset;
import com.courseenglish.api.domain.request.ReqLessonAssetDTO;
import com.courseenglish.api.domain.response.ResLessonAssetDTO;
import com.courseenglish.api.repository.LessonAssetRepository;
import com.courseenglish.api.repository.LessonRepository;
import com.courseenglish.api.service.LessonAssetService;
import com.courseenglish.api.service.cache.lesson.LessonCacheEvictor;
import com.courseenglish.api.util.error.IdInvalidException;

@Service
public class LessonAssetServiceImpl implements LessonAssetService {

    private final LessonAssetRepository lessonAssetRepository;
    private final LessonRepository lessonRepository;
    private final LessonCacheEvictor lessonCacheEvictor;

    public LessonAssetServiceImpl(
            LessonAssetRepository lessonAssetRepository,
            LessonRepository lessonRepository,
            LessonCacheEvictor lessonCacheEvictor) {
        this.lessonAssetRepository = lessonAssetRepository;
        this.lessonRepository = lessonRepository;
        this.lessonCacheEvictor = lessonCacheEvictor;
    }

    @Override
    public List<ResLessonAssetDTO> listByLessonId(UUID lessonId) {
        return lessonAssetRepository.findByLesson_IdAndVoidedFalseOrderByDisplayOrderAsc(lessonId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public ResLessonAssetDTO create(UUID lessonId, ReqLessonAssetDTO request) throws IdInvalidException {
        Lesson lesson = lessonRepository.findByIdAndVoidedFalse(lessonId)
                .orElseThrow(() -> new IdInvalidException("Lesson không tồn tại!"));
        if (request.getType() == null) {
            throw new IdInvalidException("type là bắt buộc!");
        }
        if (request.getUrl() == null || request.getUrl().isBlank()) {
            throw new IdInvalidException("url là bắt buộc!");
        }

        LessonAsset entity = new LessonAsset();
        entity.setLesson(lesson);
        entity.setType(request.getType());
        entity.setUrl(request.getUrl().trim());
        entity.setCaption(request.getCaption());
        entity.setMetaJson(request.getMetaJson());
        entity.setDisplayOrder(request.getDisplayOrder());
        ResLessonAssetDTO saved = toDto(lessonAssetRepository.save(entity));
        lessonCacheEvictor.evictForLesson(lessonId);
        return saved;
    }

    @Override
    public void delete(UUID assetId) {
        lessonAssetRepository.findByIdAndVoidedFalse(assetId).ifPresent(item -> {
            UUID lessonId = item.getLesson() != null ? item.getLesson().getId() : null;
            item.setVoided(true);
            lessonAssetRepository.save(item);
            if (lessonId != null) {
                lessonCacheEvictor.evictForLesson(lessonId);
            }
        });
    }

    private ResLessonAssetDTO toDto(LessonAsset asset) {
        ResLessonAssetDTO dto = new ResLessonAssetDTO();
        dto.setId(asset.getId());
        dto.setLessonId(asset.getLesson() != null ? asset.getLesson().getId() : null);
        dto.setType(asset.getType());
        dto.setUrl(asset.getUrl());
        dto.setCaption(asset.getCaption());
        dto.setMetaJson(asset.getMetaJson());
        dto.setDisplayOrder(asset.getDisplayOrder());
        return dto;
    }
}
