package com.courseenglish.api.service.notification.impl;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.Enrollment;
import com.courseenglish.api.domain.Lesson;
import com.courseenglish.api.domain.Subject;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.dto.notification.LessonPublishedNotifyContext;
import com.courseenglish.api.domain.dto.notification.LessonPublishedNotifyContext.Recipient;
import com.courseenglish.api.repository.ClassroomRepository;
import com.courseenglish.api.repository.EnrollmentRepository;
import com.courseenglish.api.repository.LessonRepository;
import com.courseenglish.api.repository.SubjectRepository;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.service.notification.LessonPublishedContextBuilder;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
public class LessonPublishedContextBuilderImpl implements LessonPublishedContextBuilder {

    private static final Logger log = LoggerFactory.getLogger(LessonPublishedContextBuilderImpl.class);
    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String STUDENT_LESSON_PATH_PREFIX = "/student/lessons/";

    private final LessonRepository lessonRepository;
    private final SubjectRepository subjectRepository;
    private final ClassroomRepository classroomRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public LessonPublishedContextBuilderImpl(
            LessonRepository lessonRepository,
            SubjectRepository subjectRepository,
            ClassroomRepository classroomRepository,
            EnrollmentRepository enrollmentRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper) {
        this.lessonRepository = lessonRepository;
        this.subjectRepository = subjectRepository;
        this.classroomRepository = classroomRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<LessonPublishedNotifyContext> build(UUID lessonId, UUID actorUserId) {
        Lesson lesson = lessonRepository.findByIdAndVoidedFalse(lessonId).orElse(null);
        if (lesson == null) {
            log.warn("Skip lesson publish notify: lesson {} not found", lessonId);
            return Optional.empty();
        }

        Subject subject = resolveSubject(lesson);
        if (subject == null) {
            log.warn("Skip lesson publish notify: missing subject for lesson {}", lessonId);
            return Optional.empty();
        }

        Classroom classroom = resolveClassroom(subject);
        if (classroom == null) {
            log.warn("Skip lesson publish notify: missing classroom for lesson {}", lessonId);
            return Optional.empty();
        }

        List<Enrollment> enrollments = enrollmentRepository
                .findByClassroom_IdAndStatusIgnoreCaseAndVoidedFalse(classroom.getId(), ACTIVE_STATUS);
        if (enrollments.isEmpty()) {
            log.info("Lesson publish notify: no ACTIVE enrollments for lesson {}", lessonId);
            return Optional.empty();
        }

        User actor = actorUserId != null
                ? userRepository.findByIdAndVoidedFalse(actorUserId).orElse(null)
                : null;

        String title = "Bài mới: " + trimOrEmpty(lesson.getTitle());
        String body = buildBody(subject.getName(), classroom.getName());
        String linkPath = STUDENT_LESSON_PATH_PREFIX + trimOrEmpty(lesson.getSlug());
        String payloadJson;
        try {
            payloadJson = buildPayloadJson(lesson, subject, classroom, actor);
        } catch (Exception ex) {
            log.error("Failed to build notification payload for lesson {}", lessonId, ex);
            payloadJson = null;
        }

        List<Recipient> recipients = buildRecipients(enrollments, actorUserId);
        if (recipients.isEmpty()) {
            log.info("Lesson publish notify: no eligible recipients for lesson {}", lessonId);
            return Optional.empty();
        }

        return Optional.of(new LessonPublishedNotifyContext(
                lesson,
                subject,
                classroom,
                actor,
                title,
                body,
                linkPath,
                payloadJson,
                recipients));
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

    private Subject resolveSubject(Lesson lesson) {
        Subject subject = lesson.getSubject();
        if (subject != null && subject.getId() != null) {
            return subjectRepository.findByIdAndVoidedFalse(subject.getId()).orElse(subject);
        }
        return null;
    }

    private Classroom resolveClassroom(Subject subject) {
        if (subject.getClassroom() == null || subject.getClassroom().getId() == null) {
            return null;
        }
        return classroomRepository
                .findByIdAndVoidedFalse(subject.getClassroom().getId())
                .orElse(null);
    }

    private String buildBody(String subjectName, String classroomName) {
        String subjectPart = trimOrEmpty(subjectName);
        String classroomPart = trimOrEmpty(classroomName);
        if (!subjectPart.isEmpty() && !classroomPart.isEmpty()) {
            return subjectPart + " · " + classroomPart;
        }
        if (!subjectPart.isEmpty()) {
            return subjectPart;
        }
        if (!classroomPart.isEmpty()) {
            return classroomPart;
        }
        return null;
    }

    private String buildPayloadJson(Lesson lesson, Subject subject, Classroom classroom, User actor)
            throws JsonProcessingException {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("lessonId", lesson.getId() != null ? lesson.getId().toString() : null);
        payload.put("lessonSlug", lesson.getSlug());
        payload.put("lessonTitle", lesson.getTitle());
        payload.put("coverImageUrl", trimOrEmpty(lesson.getCoverImageUrl()));
        payload.put("subjectId", subject.getId() != null ? subject.getId().toString() : null);
        payload.put("subjectName", subject.getName());
        payload.put("classroomId", classroom.getId() != null ? classroom.getId().toString() : null);
        payload.put("classroomName", classroom.getName());
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
