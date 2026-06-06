package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.response.ResClassroomDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.ClassroomRepository;
import com.courseenglish.api.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import com.courseenglish.api.service.ClassroomService;

import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ClassroomServiceImpl implements ClassroomService {
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;

    public ClassroomServiceImpl(ClassroomRepository classroomRepository, UserRepository userRepository) {
        this.classroomRepository = classroomRepository;
        this.userRepository = userRepository;
    }

    public ResultPaginationDTO getAll(Specification<Classroom> spec, Pageable pageable) {
        Specification<Classroom> notVoidedSpec = (root, query, cb) -> cb.isFalse(root.get("voided"));
        Specification<Classroom> finalSpec = spec == null ? notVoidedSpec : spec.and(notVoidedSpec);
        Page<Classroom> page = classroomRepository.findAll(finalSpec, pageable);

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

    public Optional<Classroom> getById(UUID id) {
        return classroomRepository.findByIdAndVoidedFalse(id);
    }

    public ResClassroomDTO create(Classroom request) {
        Classroom entity = new Classroom();
        entity.setName(request.getName() == null ? "" : request.getName().trim());
        entity.setCode(request.getCode() == null ? "" : request.getCode().trim());
        entity.setDescription(request.getDescription());
        applyTeacher(request, entity);
        Classroom saved = classroomRepository.save(entity);
        return toDto(saved);
    }

    public ResClassroomDTO update(UUID id, Classroom request) {
        Optional<Classroom> opt = classroomRepository.findByIdAndVoidedFalse(id);
        if (opt.isEmpty()) return null;
        Classroom entity = opt.get();
        entity.setName(request.getName() == null ? "" : request.getName().trim());
        entity.setCode(request.getCode() == null ? "" : request.getCode().trim());
        entity.setDescription(request.getDescription());
        applyTeacher(request, entity);
        Classroom saved = classroomRepository.save(entity);
        return toDto(saved);
    }

    public void delete(UUID id) {
        classroomRepository.findByIdAndVoidedFalse(id).ifPresent(item -> {
            item.setVoided(true);
            classroomRepository.save(item);
        });
    }

    public boolean existsByCode(String code) {
        return classroomRepository.existsByCodeAndVoidedFalse(code == null ? "" : code.trim());
    }

    private void applyTeacher(Classroom request, Classroom target) {
        UUID teacherId = request.getTeacherId();
        if (teacherId == null && request.getTeacher() != null) {
            teacherId = request.getTeacher().getId();
        }
        if (teacherId == null) {
            target.setTeacher(null);
            return;
        }
        User teacher = userRepository.findByIdAndVoidedFalse(teacherId).orElse(null);
        target.setTeacher(teacher);
    }

    public ResClassroomDTO toDto(Classroom classroom) {
        ResClassroomDTO dto = new ResClassroomDTO();
        dto.setId(classroom.getId());
        dto.setName(classroom.getName());
        dto.setCode(classroom.getCode());
        dto.setDescription(classroom.getDescription());
        dto.setTeacherId(classroom.getTeacher() != null ? classroom.getTeacher().getId() : null);
        dto.setTeacherName(classroom.getTeacher() != null ? classroom.getTeacher().getName() : null);
        return dto;
    }
}
