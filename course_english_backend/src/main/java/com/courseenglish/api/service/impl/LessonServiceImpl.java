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
import com.courseenglish.api.service.LessonService;
import com.courseenglish.api.util.constant.LessonStatusEnum;
import com.courseenglish.api.util.error.IdInvalidException;

@Service
public class LessonServiceImpl implements LessonService {

    private final LessonRepository lessonRepository;
    private final SubjectRepository subjectRepository;
    private final LessonBlockRepository lessonBlockRepository;
    private final LessonBlockService lessonBlockService;
    private final LessonAssetService lessonAssetService;

    public LessonServiceImpl(
            LessonRepository lessonRepository,
            SubjectRepository subjectRepository,
            LessonBlockRepository lessonBlockRepository,
            LessonBlockService lessonBlockService,
            LessonAssetService lessonAssetService) {
        this.lessonRepository = lessonRepository;
        this.subjectRepository = subjectRepository;
        this.lessonBlockRepository = lessonBlockRepository;
        this.lessonBlockService = lessonBlockService;
        this.lessonAssetService = lessonAssetService;
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

        ResLessonDetailDTO detail = new ResLessonDetailDTO();
        copyLessonFields(lesson, detail);
        detail.setBlocks(lessonBlockService.listByLessonId(id));
        detail.setAssets(lessonAssetService.listByLessonId(id));
        return detail;
    }

    @Override
    public ResLessonDTO create(Lesson request) throws IdInvalidException {
        Subject subject = resolveSubject(request);
        Lesson entity = new Lesson();
        entity.setTitle(request.getTitle() == null ? "" : request.getTitle().trim());
        entity.setSummary(request.getSummary());
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
        entity.setStatus(LessonStatusEnum.PUBLISHED);
        return toDto(lessonRepository.save(entity));
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

    private void copyLessonFields(Lesson lesson, ResLessonDTO dto) {
        dto.setId(lesson.getId());
        dto.setTitle(lesson.getTitle());
        dto.setSummary(lesson.getSummary());
        dto.setStatus(lesson.getStatus());
        dto.setDisplayOrder(lesson.getDisplayOrder());
        dto.setSubjectId(lesson.getSubject() != null ? lesson.getSubject().getId() : null);
        dto.setSubjectName(lesson.getSubject() != null ? lesson.getSubject().getName() : null);
        dto.setBlockCount(lessonBlockRepository.countByLesson_IdAndVoidedFalse(lesson.getId()));
    }
}
