package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.Subject;
import com.courseenglish.api.domain.response.ResSubjectDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.ClassroomRepository;
import com.courseenglish.api.repository.SubjectRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import com.courseenglish.api.service.SubjectService;

import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SubjectServiceImpl implements SubjectService {
    private final SubjectRepository subjectRepository;
    private final ClassroomRepository classroomRepository;

    public SubjectServiceImpl(SubjectRepository subjectRepository, ClassroomRepository classroomRepository) {
        this.subjectRepository = subjectRepository;
        this.classroomRepository = classroomRepository;
    }

    public ResultPaginationDTO getAll(Specification<Subject> spec, Pageable pageable) {
        Specification<Subject> notVoidedSpec = (root, query, cb) -> cb.isFalse(root.get("voided"));
        Specification<Subject> finalSpec = spec == null ? notVoidedSpec : spec.and(notVoidedSpec);
        Page<Subject> page = subjectRepository.findAll(finalSpec, pageable);

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

    public Optional<Subject> getById(UUID id) {
        return subjectRepository.findByIdAndVoidedFalse(id);
    }

    public ResSubjectDTO create(Subject request) {
        Subject entity = new Subject();
        entity.setName(request.getName() == null ? "" : request.getName().trim());
        entity.setDisplayOrder(request.getDisplayOrder());
        applyClassroom(request, entity);
        Subject saved = subjectRepository.save(entity);
        return toDto(saved);
    }

    public ResSubjectDTO update(UUID id, Subject request) {
        Optional<Subject> opt = subjectRepository.findByIdAndVoidedFalse(id);
        if (opt.isEmpty()) return null;
        Subject entity = opt.get();
        entity.setName(request.getName() == null ? "" : request.getName().trim());
        entity.setDisplayOrder(request.getDisplayOrder());
        applyClassroom(request, entity);
        Subject saved = subjectRepository.save(entity);
        return toDto(saved);
    }

    public void delete(UUID id) {
        subjectRepository.findByIdAndVoidedFalse(id).ifPresent(item -> {
            item.setVoided(true);
            subjectRepository.save(item);
        });
    }

    private void applyClassroom(Subject request, Subject target) {
        UUID classroomId = request.getClassroomId();
        if (classroomId == null && request.getClassroom() != null) {
            classroomId = request.getClassroom().getId();
        }
        if (classroomId == null) {
            target.setClassroom(null);
            return;
        }
        Classroom classroom = classroomRepository.findByIdAndVoidedFalse(classroomId).orElse(null);
        target.setClassroom(classroom);
    }

    public ResSubjectDTO toDto(Subject subject) {
        ResSubjectDTO dto = new ResSubjectDTO();
        dto.setId(subject.getId());
        dto.setName(subject.getName());
        dto.setDisplayOrder(subject.getDisplayOrder());
        dto.setClassroomId(subject.getClassroom() != null ? subject.getClassroom().getId() : null);
        dto.setClassroomName(subject.getClassroom() != null ? subject.getClassroom().getName() : null);
        return dto;
    }
}
