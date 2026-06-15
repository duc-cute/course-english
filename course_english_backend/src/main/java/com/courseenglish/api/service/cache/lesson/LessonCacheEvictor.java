package com.courseenglish.api.service.cache.lesson;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.courseenglish.api.repository.LessonBlockRepository;
import com.courseenglish.api.repository.LessonRepository;

@Component
public class LessonCacheEvictor {

    private final LessonCacheService lessonCacheService;
    private final LessonRepository lessonRepository;
    private final LessonBlockRepository lessonBlockRepository;

    public LessonCacheEvictor(
            LessonCacheService lessonCacheService,
            LessonRepository lessonRepository,
            LessonBlockRepository lessonBlockRepository) {
        this.lessonCacheService = lessonCacheService;
        this.lessonRepository = lessonRepository;
        this.lessonBlockRepository = lessonBlockRepository;
    }

    public void evictForLesson(UUID lessonId) {
        if (lessonId == null) {
            return;
        }
        lessonRepository.findByIdAndVoidedFalse(lessonId).ifPresent(lesson -> {
            UUID subjectId = lesson.getSubject() != null ? lesson.getSubject().getId() : null;
            lessonCacheService.evict(lesson.getId(), lesson.getSlug(), subjectId);
        });
    }

    public void evictForBlock(UUID blockId) {
        if (blockId == null) {
            return;
        }
        lessonBlockRepository.findById(blockId).ifPresent(block -> {
            if (block.getLesson() != null && block.getLesson().getId() != null) {
                evictForLesson(block.getLesson().getId());
            }
        });
    }
}
