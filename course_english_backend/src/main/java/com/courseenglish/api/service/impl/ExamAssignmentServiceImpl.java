package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.Enrollment;
import com.courseenglish.api.domain.ExamAssignment;
import com.courseenglish.api.domain.ExamAttempt;
import com.courseenglish.api.domain.ExamPaper;
import com.courseenglish.api.domain.ExamSection;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.request.ReqCreateExamAssignmentDTO;
import com.courseenglish.api.domain.request.ReqSearchExamAssignmentDTO;
import com.courseenglish.api.domain.response.ResExamAssignmentDTO;
import com.courseenglish.api.domain.response.ResExamAttemptDTO;
import com.courseenglish.api.domain.response.ResExamClassScoreDTO;
import com.courseenglish.api.domain.response.ResExamSectionDTO;
import com.courseenglish.api.domain.response.ResStudentExamAssignmentDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.ClassroomRepository;
import com.courseenglish.api.repository.EnrollmentRepository;
import com.courseenglish.api.repository.ExamAssignmentRepository;
import com.courseenglish.api.repository.ExamAttemptRepository;
import com.courseenglish.api.repository.ExamPaperRepository;
import com.courseenglish.api.repository.ExamSectionRepository;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.service.ExamAssignedNotifier;
import com.courseenglish.api.service.ExamAssignmentService;
import com.courseenglish.api.service.ExamSectionPayloadValidator;
import com.courseenglish.api.service.StudentEnrollmentAccessService;
import com.courseenglish.api.service.exam.ExamPaperAnswerRedactor;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.constant.ExamAssignmentStatusEnum;
import com.courseenglish.api.util.constant.ExamAttemptStatusEnum;
import com.courseenglish.api.util.constant.ExamPaperStatusEnum;
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
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ExamAssignmentServiceImpl implements ExamAssignmentService {

    private static final String ENROLLMENT_ACTIVE = "ACTIVE";

    private final ExamAssignmentRepository assignmentRepository;
    private final ExamAttemptRepository attemptRepository;
    private final ExamPaperRepository examPaperRepository;
    private final ExamSectionRepository examSectionRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentEnrollmentAccessService enrollmentAccessService;
    private final ExamSectionPayloadValidator payloadValidator;
    private final ExamPaperAnswerRedactor answerRedactor;
    private final ExamAssignedNotifier examAssignedNotifier;

    public ExamAssignmentServiceImpl(
            ExamAssignmentRepository assignmentRepository,
            ExamAttemptRepository attemptRepository,
            ExamPaperRepository examPaperRepository,
            ExamSectionRepository examSectionRepository,
            ClassroomRepository classroomRepository,
            UserRepository userRepository,
            EnrollmentRepository enrollmentRepository,
            StudentEnrollmentAccessService enrollmentAccessService,
            ExamSectionPayloadValidator payloadValidator,
            ExamPaperAnswerRedactor answerRedactor,
            ExamAssignedNotifier examAssignedNotifier) {
        this.assignmentRepository = assignmentRepository;
        this.attemptRepository = attemptRepository;
        this.examPaperRepository = examPaperRepository;
        this.examSectionRepository = examSectionRepository;
        this.classroomRepository = classroomRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.enrollmentAccessService = enrollmentAccessService;
        this.payloadValidator = payloadValidator;
        this.answerRedactor = answerRedactor;
        this.examAssignedNotifier = examAssignedNotifier;
    }

    @Override
    @Transactional
    public ResExamAssignmentDTO create(ReqCreateExamAssignmentDTO request) throws IdInvalidException {
        requireStaff();

        ExamPaper paper = examPaperRepository
                .findByIdAndVoidedFalse(request.getExamPaperId())
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy đề thi"));
        if (paper.getStatus() != ExamPaperStatusEnum.PUBLISHED) {
            throw new IdInvalidException("Chỉ gán được đề đã publish");
        }

        Classroom classroom = classroomRepository
                .findByIdAndVoidedFalse(request.getClassroomId())
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy lớp học"));
        requireTeacherCanAssignClassroom(classroom);

        if (request.getOpenAt() != null
                && request.getCloseAt() != null
                && request.getCloseAt().isBefore(request.getOpenAt())) {
            throw new IdInvalidException("closeAt phải sau openAt");
        }

        assignmentRepository
                .findFirstByExamPaper_IdAndClassroom_IdAndStatusAndVoidedFalse(
                        paper.getId(), classroom.getId(), ExamAssignmentStatusEnum.ACTIVE)
                .ifPresent(existing -> {
                    existing.setStatus(ExamAssignmentStatusEnum.CANCELLED);
                    existing.setVoided(true);
                    assignmentRepository.save(existing);
                });

        ExamAssignment entity = new ExamAssignment();
        entity.setExamPaper(paper);
        entity.setClassroom(classroom);
        entity.setAssignedAt(Instant.now());
        entity.setOpenAt(request.getOpenAt());
        entity.setDueAt(request.getDueAt());
        entity.setCloseAt(request.getCloseAt());
        entity.setMaxAttempts(
                request.getMaxAttempts() == null ? 1 : Math.max(1, Math.min(10, request.getMaxAttempts())));
        entity.setNote(request.getNote() != null ? request.getNote().trim() : null);
        entity.setStatus(ExamAssignmentStatusEnum.ACTIVE);

        SercurityUtil.getCurrentUserId()
                .flatMap(userRepository::findByIdAndVoidedFalse)
                .ifPresent(entity::setAssignedBy);

        ExamAssignment saved = assignmentRepository.save(entity);
        UUID actorUserId = saved.getAssignedBy() != null
                ? saved.getAssignedBy().getId()
                : SercurityUtil.getCurrentUserId().orElse(null);
        examAssignedNotifier.dispatchExamAssignedAsync(saved.getId(), actorUserId);
        return toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ResultPaginationDTO search(ReqSearchExamAssignmentDTO request) throws IdInvalidException {
        requireStaff();
        ReqSearchExamAssignmentDTO req =
                request == null ? new ReqSearchExamAssignmentDTO() : request;

        int page = req.getPage() == null || req.getPage() < 0 ? 0 : req.getPage();
        int size = req.getSize() == null || req.getSize() < 1 ? 20 : Math.min(req.getSize(), 100);
        Pageable pageable = PageRequest.of(page, size, parseSort(req.getSort()));

        Page<ExamAssignment> result = assignmentRepository.findAll(buildSearchSpec(req), pageable);

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
        ExamAssignment entity = assignmentRepository
                .findByIdWithDetails(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy lần gán đề"));
        requireTeacherCanAssignClassroom(entity.getClassroom());
        entity.setStatus(ExamAssignmentStatusEnum.CANCELLED);
        entity.setVoided(true);
        assignmentRepository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResExamClassScoreDTO> listClassScores(UUID assignmentId) throws IdInvalidException {
        requireStaff();
        ExamAssignment assignment = assignmentRepository
                .findByIdWithDetails(assignmentId)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy lần gán đề"));
        requireTeacherCanAssignClassroom(assignment.getClassroom());

        List<Enrollment> enrollments = enrollmentRepository.findByClassroom_IdAndStatusIgnoreCaseAndVoidedFalse(
                assignment.getClassroom().getId(), ENROLLMENT_ACTIVE);

        List<ExamAttempt> attempts = attemptRepository.findByAssignment_IdAndVoidedFalse(assignmentId);
        Map<UUID, List<ExamAttempt>> byUser = new HashMap<>();
        for (ExamAttempt attempt : attempts) {
            byUser.computeIfAbsent(attempt.getUserId(), k -> new ArrayList<>()).add(attempt);
        }

        List<ResExamClassScoreDTO> rows = new ArrayList<>();
        for (Enrollment enrollment : enrollments) {
            User student = enrollment.getStudent();
            if (student == null || student.getId() == null) {
                continue;
            }
            ResExamClassScoreDTO row = new ResExamClassScoreDTO();
            row.setStudentId(student.getId());
            row.setStudentName(student.getName());
            row.setStudentEmail(student.getEmail());

            List<ExamAttempt> userAttempts = byUser.getOrDefault(student.getId(), Collections.emptyList());
            if (userAttempts.isEmpty()) {
                row.setAttemptStatus("NOT_STARTED");
                rows.add(row);
                continue;
            }

            ExamAttempt latest = userAttempts.stream()
                    .max(Comparator.comparingInt(ExamAttempt::getAttemptNo))
                    .orElse(null);
            ExamAttempt bestSubmitted = userAttempts.stream()
                    .filter(a -> a.getStatus() == ExamAttemptStatusEnum.SUBMITTED
                            || a.getStatus() == ExamAttemptStatusEnum.TIMED_OUT)
                    .filter(a -> a.getScorePercent() != null)
                    .max(Comparator
                            .comparingInt(ExamAttempt::getScorePercent)
                            .thenComparing(ExamAttempt::getSubmittedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                    .orElse(null);

            if (latest != null && latest.getStatus() == ExamAttemptStatusEnum.IN_PROGRESS) {
                row.setAttemptStatus("IN_PROGRESS");
                row.setLatestStatus(ExamAttemptStatusEnum.IN_PROGRESS);
                row.setAttemptNo(latest.getAttemptNo());
            } else if (bestSubmitted != null) {
                row.setAttemptStatus(bestSubmitted.getStatus().name());
                row.setLatestStatus(bestSubmitted.getStatus());
                row.setAttemptNo(bestSubmitted.getAttemptNo());
                row.setScorePercent(bestSubmitted.getScorePercent());
                row.setPassed(bestSubmitted.getPassed());
                row.setSubmittedAt(bestSubmitted.getSubmittedAt());
            } else if (latest != null) {
                row.setAttemptStatus(latest.getStatus().name());
                row.setLatestStatus(latest.getStatus());
                row.setAttemptNo(latest.getAttemptNo());
            }
            rows.add(row);
        }

        rows.sort(Comparator.comparing(
                r -> r.getStudentName() == null ? "" : r.getStudentName(),
                String.CASE_INSENSITIVE_ORDER));
        return rows;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResStudentExamAssignmentDTO> listAssignedForCurrentStudent(UUID classroomId)
            throws IdInvalidException {
        List<UUID> classroomIds = enrollmentAccessService.resolveEnrolledClassroomIds(classroomId);
        if (classroomIds.isEmpty()) {
            return Collections.emptyList();
        }
        UUID studentId = enrollmentAccessService
                .currentStudentId()
                .orElseThrow(() -> new IdInvalidException("Cần đăng nhập"));

        return assignmentRepository.findActiveByClassroomIds(classroomIds).stream()
                .map(a -> toStudentDto(a, studentId, false))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ResStudentExamAssignmentDTO getAssignedForCurrentStudent(UUID assignmentId, boolean includeSections)
            throws IdInvalidException {
        UUID studentId = enrollmentAccessService
                .currentStudentId()
                .orElseThrow(() -> new IdInvalidException("Cần đăng nhập"));

        ExamAssignment entity = assignmentRepository
                .findByIdWithDetails(assignmentId)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy đề được giao"));

        if (entity.getStatus() != ExamAssignmentStatusEnum.ACTIVE || entity.isVoided()) {
            throw new IdInvalidException("Đề được giao không còn hiệu lực");
        }

        boolean enrolled = enrollmentRepository
                .findActiveByClassroomAndStudent(entity.getClassroom().getId(), studentId)
                .isPresent();
        if (!enrolled) {
            throw new IdInvalidException("Bạn không thuộc lớp được giao đề này");
        }
        return toStudentDto(entity, studentId, includeSections);
    }

    public static boolean isWindowOpen(ExamAssignment assignment, Instant now) {
        if (assignment.getOpenAt() != null && now.isBefore(assignment.getOpenAt())) {
            return false;
        }
        if (assignment.getCloseAt() != null && now.isAfter(assignment.getCloseAt())) {
            return false;
        }
        return true;
    }

    private ResStudentExamAssignmentDTO toStudentDto(
            ExamAssignment entity, UUID studentId, boolean includeSections) {
        ResStudentExamAssignmentDTO dto = new ResStudentExamAssignmentDTO();
        copyAssignmentFields(entity, dto);

        Instant now = Instant.now();
        boolean windowOpen = isWindowOpen(entity, now);
        dto.setWindowOpen(windowOpen);

        List<ExamAttempt> attempts =
                attemptRepository.findByAssignment_IdAndUserIdAndVoidedFalseOrderByAttemptNoAsc(
                        entity.getId(), studentId);

        long finished = attempts.stream()
                .filter(a -> a.getStatus() == ExamAttemptStatusEnum.SUBMITTED
                        || a.getStatus() == ExamAttemptStatusEnum.TIMED_OUT)
                .count();
        ExamAttempt inProgress = attempts.stream()
                .filter(a -> a.getStatus() == ExamAttemptStatusEnum.IN_PROGRESS)
                .max(Comparator.comparingInt(ExamAttempt::getAttemptNo))
                .orElse(null);
        ExamAttempt latestSubmitted = attempts.stream()
                .filter(a -> a.getStatus() == ExamAttemptStatusEnum.SUBMITTED
                        || a.getStatus() == ExamAttemptStatusEnum.TIMED_OUT)
                .max(Comparator.comparingInt(ExamAttempt::getAttemptNo))
                .orElse(null);

        int used = (int) finished + (inProgress != null ? 1 : 0);
        dto.setAttemptsUsed(used);
        dto.setAttemptsRemaining(Math.max(0, entity.getMaxAttempts() - (int) finished));
        dto.setCanStart(
                windowOpen
                        && inProgress == null
                        && finished < entity.getMaxAttempts());
        if (inProgress != null) {
            dto.setInProgressAttempt(toAttemptDto(inProgress));
        }
        if (latestSubmitted != null) {
            dto.setLatestSubmittedAttempt(toAttemptDto(latestSubmitted));
        }

        if (includeSections && entity.getExamPaper() != null) {
            dto.setSections(loadRedactedSections(entity.getExamPaper().getId()));
        }
        return dto;
    }

    private List<ResExamSectionDTO> loadRedactedSections(UUID examPaperId) {
        return examSectionRepository
                .findByExamPaper_IdAndVoidedFalseOrderByDisplayOrderAsc(examPaperId)
                .stream()
                .map(this::toSectionDtoRedacted)
                .collect(Collectors.toList());
    }

    private ResExamSectionDTO toSectionDtoRedacted(ExamSection section) {
        ResExamSectionDTO dto = new ResExamSectionDTO();
        dto.setId(section.getId());
        if (section.getExamPaper() != null) {
            dto.setExamPaperId(section.getExamPaper().getId());
        }
        dto.setDisplayOrder(section.getDisplayOrder());
        dto.setTitle(section.getTitle());
        dto.setInstruction(section.getInstruction());
        dto.setQuestionType(section.getQuestionType());
        dto.setPayloadJson(answerRedactor.redactPayloadJson(section.getPayloadJson()));
        dto.setQuestionCount(payloadValidator.countQuestions(section.getPayloadJson()));
        dto.setCreatedAt(section.getCreatedAt());
        dto.setUpdatedAt(section.getUpdatedAt());
        return dto;
    }

    private ResExamAssignmentDTO toDto(ExamAssignment entity) {
        ResExamAssignmentDTO dto = new ResExamAssignmentDTO();
        copyAssignmentFields(entity, dto);
        return dto;
    }

    private void copyAssignmentFields(ExamAssignment entity, ResExamAssignmentDTO dto) {
        dto.setId(entity.getId());
        dto.setAssignedAt(entity.getAssignedAt());
        dto.setOpenAt(entity.getOpenAt());
        dto.setDueAt(entity.getDueAt());
        dto.setCloseAt(entity.getCloseAt());
        dto.setMaxAttempts(entity.getMaxAttempts());
        dto.setNote(entity.getNote());
        dto.setStatus(entity.getStatus());

        ExamPaper paper = entity.getExamPaper();
        if (paper != null) {
            dto.setExamPaperId(paper.getId());
            dto.setExamPaperTitle(paper.getTitle());
            dto.setDurationMinutes(paper.getDurationMinutes());
            dto.setPassScorePercent(paper.getPassScorePercent());
            List<ExamSection> sections =
                    examSectionRepository.findByExamPaper_IdAndVoidedFalse(paper.getId());
            dto.setSectionCount(sections.size());
            int qCount = 0;
            for (ExamSection section : sections) {
                qCount += payloadValidator.countQuestions(section.getPayloadJson());
            }
            dto.setQuestionCount(qCount);
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
    }

    static ResExamAttemptDTO toAttemptDto(ExamAttempt attempt) {
        ResExamAttemptDTO dto = new ResExamAttemptDTO();
        dto.setId(attempt.getId());
        if (attempt.getAssignment() != null) {
            dto.setAssignmentId(attempt.getAssignment().getId());
        }
        dto.setExamPaperId(attempt.getExamPaperId());
        dto.setUserId(attempt.getUserId());
        dto.setAttemptNo(attempt.getAttemptNo());
        dto.setStatus(attempt.getStatus());
        dto.setStartedAt(attempt.getStartedAt());
        dto.setSubmittedAt(attempt.getSubmittedAt());
        dto.setElapsedMs(attempt.getElapsedMs());
        dto.setCorrectCount(attempt.getCorrectCount());
        dto.setTotalCount(attempt.getTotalCount());
        dto.setScorePercent(attempt.getScorePercent());
        dto.setPassed(attempt.getPassed());
        dto.setPassScorePercent(attempt.getPassScorePercent());
        return dto;
    }

    private void requireStaff() throws IdInvalidException {
        if (!SercurityUtil.isStaffUser()) {
            throw new IdInvalidException("Chỉ giáo viên hoặc quản trị mới gán được đề");
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
            throw new IdInvalidException("Bạn chỉ được gán đề cho lớp mình phụ trách");
        }
    }

    private Specification<ExamAssignment> buildSearchSpec(ReqSearchExamAssignmentDTO req) {
        return (root, query, cb) -> {
            if (query != null) {
                query.distinct(true);
            }
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("voided")));

            if (req.getStatus() != null && !req.getStatus().isBlank()) {
                try {
                    predicates.add(
                            cb.equal(
                                    root.get("status"),
                                    ExamAssignmentStatusEnum.valueOf(
                                            req.getStatus().trim().toUpperCase())));
                } catch (IllegalArgumentException ex) {
                    predicates.add(cb.disjunction());
                }
            } else {
                predicates.add(cb.equal(root.get("status"), ExamAssignmentStatusEnum.ACTIVE));
            }
            if (req.getClassroomId() != null) {
                predicates.add(cb.equal(root.get("classroom").get("id"), req.getClassroomId()));
            }
            if (req.getExamPaperId() != null) {
                predicates.add(cb.equal(root.get("examPaper").get("id"), req.getExamPaperId()));
            }
            if (req.getKeyword() != null && !req.getKeyword().isBlank()) {
                String pattern = "%" + req.getKeyword().trim().toLowerCase() + "%";
                Join<ExamAssignment, ExamPaper> paperJoin = root.join("examPaper", JoinType.INNER);
                predicates.add(cb.like(cb.lower(paperJoin.get("title")), pattern));
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
}
