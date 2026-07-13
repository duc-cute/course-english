package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.VocabularySet;
import com.courseenglish.api.domain.VocabularySetAssignment;
import com.courseenglish.api.domain.request.ReqSearchVocabularySetAssignmentDTO;
import com.courseenglish.api.domain.request.ReqVocabularySetAssignmentDTO;
import com.courseenglish.api.domain.response.ResVocabularySetAssignmentDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.ClassroomRepository;
import com.courseenglish.api.repository.EnrollmentRepository;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.repository.VocabularySetAssignmentRepository;
import com.courseenglish.api.repository.VocabularySetMemberRepository;
import com.courseenglish.api.repository.VocabularySetRepository;
import com.courseenglish.api.service.StudentEnrollmentAccessService;
import com.courseenglish.api.service.VocabularySetAssignmentService;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VocabularySetAssignmentServiceImpl implements VocabularySetAssignmentService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_CANCELLED = "CANCELLED";

    private final VocabularySetAssignmentRepository assignmentRepository;
    private final VocabularySetRepository vocabularySetRepository;
    private final VocabularySetMemberRepository memberRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentEnrollmentAccessService enrollmentAccessService;

    public VocabularySetAssignmentServiceImpl(
            VocabularySetAssignmentRepository assignmentRepository,
            VocabularySetRepository vocabularySetRepository,
            VocabularySetMemberRepository memberRepository,
            ClassroomRepository classroomRepository,
            UserRepository userRepository,
            EnrollmentRepository enrollmentRepository,
            StudentEnrollmentAccessService enrollmentAccessService) {
        this.assignmentRepository = assignmentRepository;
        this.vocabularySetRepository = vocabularySetRepository;
        this.memberRepository = memberRepository;
        this.classroomRepository = classroomRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.enrollmentAccessService = enrollmentAccessService;
    }

    @Override
    @Transactional
    public ResVocabularySetAssignmentDTO create(ReqVocabularySetAssignmentDTO request)
            throws IdInvalidException {
        requireStaff();

        VocabularySet set = vocabularySetRepository
                .findByIdAndVoidedFalse(request.getVocabularySetId())
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy bộ từ vựng"));
        Classroom classroom = classroomRepository
                .findByIdAndVoidedFalse(request.getClassroomId())
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy lớp học"));

        requireTeacherCanAssignClassroom(classroom);

        assignmentRepository
                .findFirstByVocabularySet_IdAndClassroom_IdAndStatusIgnoreCaseAndVoidedFalse(
                        set.getId(), classroom.getId(), STATUS_ACTIVE)
                .ifPresent(existing -> {
                    existing.setStatus(STATUS_CANCELLED);
                    existing.setVoided(true);
                    assignmentRepository.save(existing);
                });

        VocabularySetAssignment entity = new VocabularySetAssignment();
        entity.setVocabularySet(set);
        entity.setClassroom(classroom);
        entity.setAssignedAt(Instant.now());
        entity.setDueAt(request.getDueAt());
        entity.setNote(request.getNote() != null ? request.getNote().trim() : null);
        entity.setStatus(STATUS_ACTIVE);

        SercurityUtil.getCurrentUserId()
                .flatMap(userRepository::findByIdAndVoidedFalse)
                .ifPresent(entity::setAssignedBy);

        return toDto(assignmentRepository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public ResultPaginationDTO search(ReqSearchVocabularySetAssignmentDTO request)
            throws IdInvalidException {
        requireStaff();
        ReqSearchVocabularySetAssignmentDTO req =
                request == null ? new ReqSearchVocabularySetAssignmentDTO() : request;

        int page = req.getPage() == null || req.getPage() < 0 ? 0 : req.getPage();
        int size = req.getSize() == null || req.getSize() < 1 ? 20 : Math.min(req.getSize(), 100);
        Pageable pageable = PageRequest.of(page, size, parseSort(req.getSort()));

        Specification<VocabularySetAssignment> spec = buildSearchSpec(req);
        Page<VocabularySetAssignment> result = assignmentRepository.findAll(spec, pageable);

        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(result.getNumber());
        meta.setPageSize(result.getSize());
        meta.setPages(result.getTotalPages());
        meta.setTotal(result.getTotalElements());

        ResultPaginationDTO dto = new ResultPaginationDTO();
        dto.setMeta(meta);
        dto.setResult(result.getContent().stream().map(this::toDto).collect(Collectors.toList()));
        return dto;
    }

    @Override
    @Transactional
    public void cancel(UUID id) throws IdInvalidException {
        requireStaff();
        VocabularySetAssignment entity = assignmentRepository
                .findByIdWithDetails(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy lần gán bộ từ"));
        requireTeacherCanAssignClassroom(entity.getClassroom());
        entity.setStatus(STATUS_CANCELLED);
        entity.setVoided(true);
        assignmentRepository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResVocabularySetAssignmentDTO> listAssignedForCurrentStudent(UUID classroomId)
            throws IdInvalidException {
        List<UUID> classroomIds = enrollmentAccessService.resolveEnrolledClassroomIds(classroomId);
        if (classroomIds.isEmpty()) {
            return Collections.emptyList();
        }
        return assignmentRepository.findActiveByClassroomIds(classroomIds).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ResVocabularySetAssignmentDTO getAssignedForCurrentStudent(UUID assignmentId)
            throws IdInvalidException {
        UUID studentId = enrollmentAccessService
                .currentStudentId()
                .orElseThrow(() -> new IdInvalidException("Cần đăng nhập"));

        VocabularySetAssignment entity = assignmentRepository
                .findByIdWithDetails(assignmentId)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy bộ từ được giao"));

        if (!STATUS_ACTIVE.equalsIgnoreCase(entity.getStatus()) || entity.isVoided()) {
            throw new IdInvalidException("Bộ từ được giao không còn hiệu lực");
        }

        UUID classroomId = entity.getClassroom().getId();
        boolean enrolled = enrollmentRepository
                .findActiveByClassroomAndStudent(classroomId, studentId)
                .isPresent();
        if (!enrolled) {
            throw new IdInvalidException("Bạn không thuộc lớp được giao bộ từ này");
        }
        return toDto(entity);
    }

    private void requireStaff() throws IdInvalidException {
        if (!SercurityUtil.isStaffUser()) {
            throw new IdInvalidException("Chỉ giáo viên hoặc quản trị mới gán được bộ từ");
        }
    }

    private void requireTeacherCanAssignClassroom(Classroom classroom) throws IdInvalidException {
        if (SercurityUtil.isAdminUser()) {
            return;
        }
        UUID userId = SercurityUtil.getCurrentUserId()
                .orElseThrow(() -> new IdInvalidException("Không xác định được người dùng"));
        if (classroom.getTeacher() == null
                || classroom.getTeacher().getId() == null
                || !classroom.getTeacher().getId().equals(userId)) {
            throw new IdInvalidException("Bạn chỉ được gán bộ từ cho lớp mình phụ trách");
        }
    }

    private Specification<VocabularySetAssignment> buildSearchSpec(ReqSearchVocabularySetAssignmentDTO req) {
        return (root, query, cb) -> {
            if (query != null) {
                query.distinct(true);
            }
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("voided")));

            if (req.getStatus() != null && !req.getStatus().isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("status")), req.getStatus().trim().toUpperCase()));
            } else {
                predicates.add(cb.equal(cb.upper(root.get("status")), STATUS_ACTIVE));
            }
            if (req.getClassroomId() != null) {
                predicates.add(cb.equal(root.get("classroom").get("id"), req.getClassroomId()));
            }
            if (req.getVocabularySetId() != null) {
                predicates.add(cb.equal(root.get("vocabularySet").get("id"), req.getVocabularySetId()));
            }
            if (req.getKeyword() != null && !req.getKeyword().isBlank()) {
                String pattern = "%" + req.getKeyword().trim().toLowerCase() + "%";
                Join<VocabularySetAssignment, VocabularySet> setJoin =
                        root.join("vocabularySet", JoinType.INNER);
                predicates.add(cb.like(cb.lower(setJoin.get("title")), pattern));
            }

            if (!SercurityUtil.isAdminUser()) {
                UUID userId = SercurityUtil.getCurrentUserId().orElse(null);
                if (userId == null) {
                    predicates.add(cb.disjunction());
                } else {
                    predicates.add(cb.equal(root.get("classroom").get("teacher").get("id"), userId));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "assignedAt");
        }
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        Sort.Direction dir =
                parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC;
        return Sort.by(dir, field);
    }

    private ResVocabularySetAssignmentDTO toDto(VocabularySetAssignment entity) {
        ResVocabularySetAssignmentDTO dto = new ResVocabularySetAssignmentDTO();
        dto.setId(entity.getId());
        dto.setAssignedAt(entity.getAssignedAt());
        dto.setDueAt(entity.getDueAt());
        dto.setNote(entity.getNote());
        dto.setStatus(entity.getStatus());

        VocabularySet set = entity.getVocabularySet();
        if (set != null) {
            dto.setVocabularySetId(set.getId());
            dto.setVocabularySetTitle(set.getTitle());
            dto.setCoverImageUrl(set.getCoverImageUrl());
            dto.setDescription(set.getDescription());
            dto.setItemCount(memberRepository.countByVocabularySet_IdAndVoidedFalse(set.getId()));
        }

        Classroom classroom = entity.getClassroom();
        if (classroom != null) {
            dto.setClassroomId(classroom.getId());
            dto.setClassroomName(classroom.getName());
        }

        User assignedBy = entity.getAssignedBy();
        if (assignedBy != null) {
            dto.setAssignedById(assignedBy.getId());
            dto.setTeacherName(assignedBy.getName());
        }
        return dto;
    }
}
