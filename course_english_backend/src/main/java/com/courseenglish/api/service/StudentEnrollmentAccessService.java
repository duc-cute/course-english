package com.courseenglish.api.service;

import com.courseenglish.api.domain.Enrollment;
import com.courseenglish.api.domain.Subject;
import com.courseenglish.api.repository.EnrollmentRepository;
import com.courseenglish.api.repository.SubjectRepository;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StudentEnrollmentAccessService {
    private static final String ACTIVE_STATUS = "ACTIVE";

    private final EnrollmentRepository enrollmentRepository;
    private final SubjectRepository subjectRepository;

    public StudentEnrollmentAccessService(
            EnrollmentRepository enrollmentRepository,
            SubjectRepository subjectRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.subjectRepository = subjectRepository;
    }

    public Optional<UUID> currentStudentId() {
        return SercurityUtil.getCurrentUserId();
    }

    /** Môn thuộc lớp HS đã ghi danh ACTIVE. classroomId=null → tất cả lớp đã ghi danh. */
    public List<UUID> resolveEnrolledSubjectIds(UUID classroomId) throws IdInvalidException {
        UUID studentId = currentStudentId()
                .orElseThrow(() -> new IdInvalidException("Cần đăng nhập để xem bài học theo lớp."));

        List<UUID> classroomIds = enrollmentRepository
                .findByStudent_IdAndStatusIgnoreCaseAndVoidedFalse(studentId, ACTIVE_STATUS)
                .stream()
                .map(Enrollment::getClassroom)
                .filter(c -> c != null && c.getId() != null)
                .map(c -> c.getId())
                .distinct()
                .collect(Collectors.toList());

        if (classroomIds.isEmpty()) {
            return Collections.emptyList();
        }

        if (classroomId != null) {
            if (!classroomIds.contains(classroomId)) {
                throw new IdInvalidException("Bạn chưa ghi danh lớp này.");
            }
            classroomIds = List.of(classroomId);
        }

        return subjectRepository.findByClassroom_IdInAndVoidedFalse(classroomIds).stream()
                .map(Subject::getId)
                .distinct()
                .collect(Collectors.toList());
    }

    /** Lớp HS đã ghi danh ACTIVE. classroomId=null → tất cả; nếu truyền thì phải thuộc danh sách. */
    public List<UUID> resolveEnrolledClassroomIds(UUID classroomId) throws IdInvalidException {
        UUID studentId = currentStudentId()
                .orElseThrow(() -> new IdInvalidException("Cần đăng nhập để xem nội dung theo lớp."));

        List<UUID> classroomIds = enrollmentRepository
                .findByStudent_IdAndStatusIgnoreCaseAndVoidedFalse(studentId, ACTIVE_STATUS)
                .stream()
                .map(Enrollment::getClassroom)
                .filter(c -> c != null && c.getId() != null)
                .map(c -> c.getId())
                .distinct()
                .collect(Collectors.toList());

        if (classroomId != null) {
            if (!classroomIds.contains(classroomId)) {
                throw new IdInvalidException("Bạn chưa ghi danh lớp này.");
            }
            return List.of(classroomId);
        }
        return classroomIds;
    }
}
