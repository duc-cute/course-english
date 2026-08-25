package com.courseenglish.api.service.notification.impl;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.Enrollment;
import com.courseenglish.api.domain.ExamAssignment;
import com.courseenglish.api.domain.ExamPaper;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.dto.notification.ExamAssignedNotifyContext;
import com.courseenglish.api.domain.dto.notification.ExamAssignedNotifyContext.Recipient;
import com.courseenglish.api.repository.ClassroomRepository;
import com.courseenglish.api.repository.EnrollmentRepository;
import com.courseenglish.api.repository.ExamAssignmentRepository;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.service.notification.ExamAssignedContextBuilder;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class ExamAssignedContextBuilderImpl implements ExamAssignedContextBuilder {

    private static final Logger log = LoggerFactory.getLogger(ExamAssignedContextBuilderImpl.class);
    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String STUDENT_EXAM_PATH_PREFIX = "/student/exams/";
    private static final DateTimeFormatter WINDOW_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault());

    private final ExamAssignmentRepository assignmentRepository;
    private final ClassroomRepository classroomRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public ExamAssignedContextBuilderImpl(
            ExamAssignmentRepository assignmentRepository,
            ClassroomRepository classroomRepository,
            EnrollmentRepository enrollmentRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper) {
        this.assignmentRepository = assignmentRepository;
        this.classroomRepository = classroomRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ExamAssignedNotifyContext> build(UUID assignmentId, UUID actorUserId) {
        ExamAssignment assignment = assignmentRepository.findByIdAndVoidedFalse(assignmentId).orElse(null);
        if (assignment == null) {
            log.warn("Skip exam assign notify: assignment {} not found", assignmentId);
            return Optional.empty();
        }

        ExamPaper paper = assignment.getExamPaper();
        if (paper == null || paper.getId() == null) {
            log.warn("Skip exam assign notify: missing exam paper for assignment {}", assignmentId);
            return Optional.empty();
        }

        Classroom classroom = resolveClassroom(assignment);
        if (classroom == null) {
            log.warn("Skip exam assign notify: missing classroom for assignment {}", assignmentId);
            return Optional.empty();
        }

        List<Enrollment> enrollments = enrollmentRepository
                .findByClassroom_IdAndStatusIgnoreCaseAndVoidedFalse(classroom.getId(), ACTIVE_STATUS);
        if (enrollments.isEmpty()) {
            log.info("Exam assign notify: no ACTIVE enrollments for assignment {}", assignmentId);
            return Optional.empty();
        }

        User actor = resolveActor(assignment, actorUserId);

        String title = "Đề thi mới: " + trimOrEmpty(paper.getTitle());
        String body = buildBody(classroom.getName(), assignment);
        String linkPath = STUDENT_EXAM_PATH_PREFIX + assignment.getId();
        String payloadJson;
        try {
            payloadJson = buildPayloadJson(assignment, paper, classroom, actor);
        } catch (Exception ex) {
            log.error("Failed to build notification payload for assignment {}", assignmentId, ex);
            payloadJson = null;
        }

        List<Recipient> recipients = buildRecipients(enrollments, actorUserId);
        if (recipients.isEmpty()) {
            log.info("Exam assign notify: no eligible recipients for assignment {}", assignmentId);
            return Optional.empty();
        }

        return Optional.of(new ExamAssignedNotifyContext(
                assignment,
                paper,
                classroom,
                actor,
                title,
                body,
                linkPath,
                payloadJson,
                recipients));
    }

    private Classroom resolveClassroom(ExamAssignment assignment) {
        Classroom classroom = assignment.getClassroom();
        if (classroom == null || classroom.getId() == null) {
            return null;
        }
        return classroomRepository.findByIdAndVoidedFalse(classroom.getId()).orElse(classroom);
    }

    private User resolveActor(ExamAssignment assignment, UUID actorUserId) {
        if (assignment.getAssignedBy() != null && assignment.getAssignedBy().getId() != null) {
            return userRepository
                    .findByIdAndVoidedFalse(assignment.getAssignedBy().getId())
                    .orElse(assignment.getAssignedBy());
        }
        if (actorUserId != null) {
            return userRepository.findByIdAndVoidedFalse(actorUserId).orElse(null);
        }
        return null;
    }

    private List<Recipient> buildRecipients(List<Enrollment> enrollments, UUID actorUserId) {
        Set<UUID> studentIds = new LinkedHashSet<>();
        for (Enrollment enrollment : enrollments) {
            if (enrollment.getStudent() == null || enrollment.getStudent().getId() == null) {
                continue;
            }
            UUID studentId = enrollment.getStudent().getId();
            if (actorUserId != null && actorUserId.equals(studentId)) {
                continue;
            }
            studentIds.add(studentId);
        }

        List<Recipient> recipients = new ArrayList<>(studentIds.size());
        for (UUID studentId : studentIds) {
            User student = userRepository.findByIdAndVoidedFalse(studentId).orElse(null);
            if (student == null) {
                continue;
            }
            String email = trimOrEmpty(student.getEmail());
            if (email.isEmpty() || !email.contains("@")) {
                continue;
            }
            recipients.add(new Recipient(studentId, email, trimOrEmpty(student.getName())));
        }
        return recipients;
    }

    private String buildBody(String classroomName, ExamAssignment assignment) {
        String classroomPart = trimOrEmpty(classroomName);
        String windowPart = formatWindow(assignment);
        if (!classroomPart.isEmpty() && !windowPart.isEmpty()) {
            return classroomPart + " · " + windowPart;
        }
        if (!classroomPart.isEmpty()) {
            return classroomPart;
        }
        return windowPart.isEmpty() ? null : windowPart;
    }

    private String formatWindow(ExamAssignment assignment) {
        if (assignment.getOpenAt() == null && assignment.getCloseAt() == null && assignment.getDueAt() == null) {
            return "Mở ngay";
        }
        List<String> parts = new ArrayList<>(2);
        if (assignment.getOpenAt() != null) {
            parts.add("Mở " + WINDOW_FMT.format(assignment.getOpenAt()));
        }
        if (assignment.getCloseAt() != null) {
            parts.add("đóng " + WINDOW_FMT.format(assignment.getCloseAt()));
        } else if (assignment.getDueAt() != null) {
            parts.add("hạn " + WINDOW_FMT.format(assignment.getDueAt()));
        }
        return String.join(" · ", parts);
    }

    private String buildPayloadJson(
            ExamAssignment assignment, ExamPaper paper, Classroom classroom, User actor)
            throws JsonProcessingException {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("assignmentId", assignment.getId() != null ? assignment.getId().toString() : null);
        payload.put("examPaperId", paper.getId() != null ? paper.getId().toString() : null);
        payload.put("examPaperTitle", paper.getTitle());
        payload.put("classroomId", classroom.getId() != null ? classroom.getId().toString() : null);
        payload.put("classroomName", classroom.getName());
        if (assignment.getOpenAt() != null) {
            payload.put("openAt", assignment.getOpenAt().toString());
        }
        if (assignment.getDueAt() != null) {
            payload.put("dueAt", assignment.getDueAt().toString());
        }
        if (assignment.getCloseAt() != null) {
            payload.put("closeAt", assignment.getCloseAt().toString());
        }
        payload.put("maxAttempts", assignment.getMaxAttempts());
        if (actor != null && actor.getId() != null) {
            payload.put("actorUserId", actor.getId().toString());
            String actorName = trimOrEmpty(actor.getName());
            if (!actorName.isEmpty()) {
                payload.put("actorName", actorName);
            }
            String actorAvatarUrl = trimOrEmpty(actor.getAvatarUrl());
            if (!actorAvatarUrl.isEmpty()) {
                payload.put("actorAvatarUrl", actorAvatarUrl);
            }
        }
        payload.values().removeIf(Objects::isNull);
        payload.values().removeIf(value -> value instanceof String s && s.isEmpty());
        return objectMapper.writeValueAsString(payload);
    }

    private String trimOrEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
