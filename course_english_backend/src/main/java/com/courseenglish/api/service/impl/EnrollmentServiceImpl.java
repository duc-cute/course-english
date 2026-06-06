package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.Enrollment;
import com.courseenglish.api.domain.Role;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.request.ReqEnrollmentDTO;
import com.courseenglish.api.domain.response.ResEnrollmentDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.ClassroomRepository;
import com.courseenglish.api.repository.EnrollmentRepository;
import com.courseenglish.api.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import com.courseenglish.api.service.EnrollmentService;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EnrollmentServiceImpl implements EnrollmentService {
    private final EnrollmentRepository enrollmentRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;

    public EnrollmentServiceImpl(
            EnrollmentRepository enrollmentRepository,
            ClassroomRepository classroomRepository,
            UserRepository userRepository
    ) {
        this.enrollmentRepository = enrollmentRepository;
        this.classroomRepository = classroomRepository;
        this.userRepository = userRepository;
    }

    public ResultPaginationDTO getAll(Specification<Enrollment> spec, Pageable pageable) {
        Specification<Enrollment> notVoidedSpec = (root, query, cb) -> cb.isFalse(root.get("voided"));
        Specification<Enrollment> finalSpec = spec == null ? notVoidedSpec : spec.and(notVoidedSpec);
        Page<Enrollment> page = enrollmentRepository.findAll(finalSpec, pageable);

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

    public Optional<Enrollment> getById(UUID id) {
        return enrollmentRepository.findByIdAndVoidedFalse(id);
    }

    public Optional<Classroom> getClassroomById(UUID id) {
        return classroomRepository.findByIdAndVoidedFalse(id);
    }

    public Optional<User> getStudentById(UUID id) {
        return userRepository.findByIdAndVoidedFalse(id);
    }

    public boolean isStudent(User user) {
        if (user == null || user.getRoles() == null) return false;
        return user.getRoles().stream().map(Role::getName).anyMatch("STUDENT_ROLE"::equals);
    }

    public boolean existsByClassroomAndStudent(UUID classroomId, UUID studentId) {
        return enrollmentRepository.existsByClassroom_IdAndStudent_IdAndVoidedFalse(classroomId, studentId);
    }

    public ResEnrollmentDTO create(ReqEnrollmentDTO req, Classroom classroom, User student) {
        Enrollment item = new Enrollment();
        item.setClassroom(classroom);
        item.setStudent(student);
        item.setStatus(normalizeStatus(req.getStatus()));
        item.setJoinedAt(Instant.now());
        Enrollment saved = enrollmentRepository.save(item);
        return toDto(saved);
    }

    public ResEnrollmentDTO update(UUID id, ReqEnrollmentDTO req, Classroom classroom, User student) {
        Optional<Enrollment> opt = enrollmentRepository.findByIdAndVoidedFalse(id);
        if (opt.isEmpty()) return null;
        Enrollment item = opt.get();
        item.setClassroom(classroom);
        item.setStudent(student);
        item.setStatus(normalizeStatus(req.getStatus()));
        Enrollment saved = enrollmentRepository.save(item);
        return toDto(saved);
    }

    public void delete(UUID id) {
        enrollmentRepository.findByIdAndVoidedFalse(id).ifPresent(item -> {
            item.setVoided(true);
            enrollmentRepository.save(item);
        });
    }

    public ResEnrollmentDTO toDto(Enrollment item) {
        ResEnrollmentDTO dto = new ResEnrollmentDTO();
        dto.setId(item.getId());
        dto.setClassroomId(item.getClassroom() != null ? item.getClassroom().getId() : null);
        dto.setClassroomName(item.getClassroom() != null ? item.getClassroom().getName() : null);
        dto.setStudentId(item.getStudent() != null ? item.getStudent().getId() : null);
        dto.setStudentName(item.getStudent() != null ? item.getStudent().getName() : null);
        dto.setStudentEmail(item.getStudent() != null ? item.getStudent().getEmail() : null);
        dto.setStatus(item.getStatus());
        dto.setJoinedAt(item.getJoinedAt());
        return dto;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return "ACTIVE";
        String normalized = status.trim().toUpperCase();
        return ("INACTIVE".equals(normalized) || "ACTIVE".equals(normalized)) ? normalized : "ACTIVE";
    }
}
