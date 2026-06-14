package com.courseenglish.api.service.impl;

import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.courseenglish.api.domain.Lesson;
import com.courseenglish.api.domain.Subject;
import com.courseenglish.api.domain.response.ResLessonDTO;
import com.courseenglish.api.domain.response.ResLessonDetailDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.LessonBlockRepository;
import com.courseenglish.api.repository.LessonRepository;
import com.courseenglish.api.repository.SubjectRepository;
import com.courseenglish.api.service.LessonAssetService;
import com.courseenglish.api.service.LessonBlockService;
import com.courseenglish.api.service.LessonPublishedNotifier;
import com.courseenglish.api.service.LessonPublishValidator;
import com.courseenglish.api.service.LessonService;
import com.courseenglish.api.service.QuestionRefResolverService;
import com.courseenglish.api.service.VocabularyBlockResolverService;
import com.courseenglish.api.util.LessonSlugUtil;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.constant.LessonStatusEnum;
import com.courseenglish.api.util.error.IdInvalidException;

@Service
public class LessonServiceImpl implements LessonService {

    private final LessonRepository lessonRepository;
    private final SubjectRepository subjectRepository;
    private final LessonBlockRepository lessonBlockRepository;
    private final LessonBlockService lessonBlockService;
    private final LessonAssetService lessonAssetService;
    private final QuestionRefResolverService questionRefResolverService;
    private final VocabularyBlockResolverService vocabularyBlockResolverService;
    private final LessonPublishValidator lessonPublishValidator;
    private final LessonPublishedNotifier lessonPublishedNotifier;

    public LessonServiceImpl(
            LessonRepository lessonRepository,
            SubjectRepository subjectRepository,
            LessonBlockRepository lessonBlockRepository,
            LessonBlockService lessonBlockService,
            LessonAssetService lessonAssetService,
            QuestionRefResolverService questionRefResolverService,
            VocabularyBlockResolverService vocabularyBlockResolverService,
            LessonPublishValidator lessonPublishValidator,
            LessonPublishedNotifier lessonPublishedNotifier) {
        this.lessonRepository = lessonRepository;
        this.subjectRepository = subjectRepository;
        this.lessonBlockRepository = lessonBlockRepository;
        this.lessonBlockService = lessonBlockService;
        this.lessonAssetService = lessonAssetService;
        this.questionRefResolverService = questionRefResolverService;
        this.vocabularyBlockResolverService = vocabularyBlockResolverService;
        this.lessonPublishValidator = lessonPublishValidator;
        this.lessonPublishedNotifier = lessonPublishedNotifier;
    }

    @Override
    public ResultPaginationDTO getAll(Specification<Lesson> spec, Pageable pageable) {
        Specification<Lesson> notVoidedSpec = (root, query, cb) -> cb.isFalse(root.get("voided"));
        Specification<Lesson> finalSpec = spec == null ? notVoidedSpec : spec.and(notVoidedSpec);
        Page<Lesson> page = lessonRepository.findAll(finalSpec, pageable);

        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setTotal(page.getTotalElements());
        meta.setPages(page.getTotalPages());

        ResultPaginationDTO dto = new ResultPaginationDTO();
        dto.setMeta(meta);
        dto.setResult(page.getContent().stream().map(this::toDto).collect(Collectors.toList()));
        return dto;
    }

    @Override
    public Optional<Lesson> getEntityById(UUID id) {
        return lessonRepository.findByIdAndVoidedFalse(id);
    }

    @Override
    public ResLessonDTO getById(UUID id) throws IdInvalidException {
        Lesson lesson = lessonRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Lesson không tồn tại!"));
        return toDto(lesson);
    }

    @Override
    public ResLessonDetailDTO getDetail(UUID id) throws IdInvalidException {
        Lesson lesson = lessonRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Lesson không tồn tại!"));
        return buildDetail(lesson);
    }

    @Override
    public ResLessonDTO getBySlug(String slug) throws IdInvalidException {
        Lesson lesson = lessonRepository.findBySlugAndVoidedFalse(slug)
                .orElseThrow(() -> new IdInvalidException("Lesson không tồn tại!"));
        return toDto(lesson);
    }

    @Override
    public ResLessonDetailDTO getDetailBySlug(String slug) throws IdInvalidException {
        Lesson lesson = lessonRepository.findBySlugAndVoidedFalse(slug)
                .orElseThrow(() -> new IdInvalidException("Lesson không tồn tại!"));
        return buildDetail(lesson);
    }

    @Override
    public void backfillTemporarySlugs() {
        for (Lesson lesson : lessonRepository.findAll()) {
            if (lesson.isVoided() || lesson.getSlug() == null || !lesson.getSlug().startsWith("lesson-")) {
                continue;
            }
            lesson.setSlug(assignUniqueSlug(lesson.getTitle(), lesson.getId()));
            lessonRepository.save(lesson);
        }
    }

    @Override
    public ResLessonDTO create(Lesson request) throws IdInvalidException {
        Subject subject = resolveSubject(request);
        Lesson entity = new Lesson();
        entity.setTitle(request.getTitle() == null ? "" : request.getTitle().trim());
        entity.setSlug(assignUniqueSlug(entity.getTitle(), null));
        entity.setSummary(request.getSummary());
        entity.setCoverImageUrl(normalizeCoverImageUrl(request.getCoverImageUrl()));
        entity.setDisplayOrder(request.getDisplayOrder());
        entity.setStatus(LessonStatusEnum.DRAFT);
        entity.setSubject(subject);
        return toDto(lessonRepository.save(entity));
    }

    @Override
    public ResLessonDTO update(UUID id, Lesson request) throws IdInvalidException {
        Lesson entity = lessonRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Lesson không tồn tại!"));
        entity.setTitle(request.getTitle() == null ? "" : request.getTitle().trim());
        entity.setSummary(request.getSummary());
        entity.setCoverImageUrl(normalizeCoverImageUrl(request.getCoverImageUrl()));
        entity.setDisplayOrder(request.getDisplayOrder());
        if (request.getSubjectId() != null || request.getSubject() != null) {
            entity.setSubject(resolveSubject(request));
        }
        return toDto(lessonRepository.save(entity));
    }

    @Override
    public void delete(UUID id) {
        lessonRepository.findByIdAndVoidedFalse(id).ifPresent(item -> {
            item.setVoided(true);
            lessonRepository.save(item);
        });
    }

    @Override
    public ResLessonDTO publish(UUID id) throws IdInvalidException {
        Lesson entity = lessonRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Lesson không tồn tại!"));
        LessonStatusEnum previousStatus = entity.getStatus();
        lessonPublishValidator.validateForPublish(id);
        entity.setStatus(LessonStatusEnum.PUBLISHED);
        Lesson saved = lessonRepository.save(entity);
        if (previousStatus != LessonStatusEnum.PUBLISHED) {
            UUID actorUserId = SercurityUtil.getCurrentUserId().orElse(null);
            lessonPublishedNotifier.dispatchLessonPublishedAsync(saved.getId(), actorUserId);
        }
        return toDto(saved);
    }

    @Override
    public ResLessonDTO unpublish(UUID id) throws IdInvalidException {
        Lesson entity = lessonRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Lesson không tồn tại!"));
        entity.setStatus(LessonStatusEnum.DRAFT);
        return toDto(lessonRepository.save(entity));
    }

    private Subject resolveSubject(Lesson request) throws IdInvalidException {
        UUID subjectId = request.getSubjectId();
        if (subjectId == null && request.getSubject() != null) {
            subjectId = request.getSubject().getId();
        }
        if (subjectId == null) {
            throw new IdInvalidException("subjectId là bắt buộc!");
        }
        return subjectRepository.findByIdAndVoidedFalse(subjectId)
                .orElseThrow(() -> new IdInvalidException("Subject không tồn tại!"));
    }

    private ResLessonDTO toDto(Lesson lesson) {
        ResLessonDTO dto = new ResLessonDTO();
        copyLessonFields(lesson, dto);
        return dto;
    }

    private ResLessonDetailDTO buildDetail(Lesson lesson) {
        ResLessonDetailDTO detail = new ResLessonDetailDTO();
        copyLessonFields(lesson, detail);
        UUID lessonId = lesson.getId();
        var blocks = lessonBlockService.listByLessonId(lessonId);
        questionRefResolverService.resolve(blocks);
        vocabularyBlockResolverService.resolve(blocks);
        detail.setBlocks(blocks);
        detail.setAssets(lessonAssetService.listByLessonId(lessonId));
        return detail;
    }

    private String assignUniqueSlug(String title, UUID excludeId) {
        String base = LessonSlugUtil.slugifyTitle(title);
        String candidate = base;
        int suffix = 2;
        while (isSlugTaken(candidate, excludeId)) {
            candidate = LessonSlugUtil.withSuffix(base, suffix++);
        }
        return candidate;
    }

    private boolean isSlugTaken(String slug, UUID excludeId) {
        if (excludeId == null) {
            return lessonRepository.existsBySlugAndVoidedFalse(slug);
        }
        return lessonRepository.existsBySlugAndVoidedFalseAndIdNot(slug, excludeId);
    }

    private void copyLessonFields(Lesson lesson, ResLessonDTO dto) {
        dto.setId(lesson.getId());
        dto.setTitle(lesson.getTitle());
        dto.setSlug(lesson.getSlug());
        dto.setSummary(lesson.getSummary());
        dto.setCoverImageUrl(lesson.getCoverImageUrl());
        dto.setStatus(lesson.getStatus());
        dto.setDisplayOrder(lesson.getDisplayOrder());
        dto.setSubjectId(lesson.getSubject() != null ? lesson.getSubject().getId() : null);
        dto.setSubjectName(lesson.getSubject() != null ? lesson.getSubject().getName() : null);
        dto.setBlockCount(lessonBlockRepository.countByLesson_IdAndVoidedFalse(lesson.getId()));
    }

    private String normalizeCoverImageUrl(String url) {
        if (url == null) {
            return null;
        }
        String trimmed = url.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
