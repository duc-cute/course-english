package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.Enrollment;
import com.courseenglish.api.domain.Lesson;
import com.courseenglish.api.domain.Notification;
import com.courseenglish.api.domain.Subject;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.repository.EnrollmentRepository;
import com.courseenglish.api.repository.LessonRepository;
import com.courseenglish.api.repository.NotificationRepository;
import com.courseenglish.api.repository.SubjectRepository;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.service.LessonNotificationService;
import com.courseenglish.api.util.constant.NotificationTypeEnum;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class LessonNotificationServiceImpl implements LessonNotificationService {

    private static final Logger log = LoggerFactory.getLogger(LessonNotificationServiceImpl.class);
    private static final int BATCH_SIZE = 100;
    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String STUDENT_LESSON_PATH_PREFIX = "/student/lessons/";

    private final LessonRepository lessonRepository;
    private final SubjectRepository subjectRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public LessonNotificationServiceImpl(
            LessonRepository lessonRepository,
            SubjectRepository subjectRepository,
            EnrollmentRepository enrollmentRepository,
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper) {
        this.lessonRepository = lessonRepository;
        this.subjectRepository = subjectRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Async("notificationExecutor")
    @Transactional
    public void notifyLessonPublishedAsync(UUID lessonId, UUID actorUserId) {
        long started = System.currentTimeMillis();
        try {
            Lesson lesson = lessonRepository.findByIdAndVoidedFalse(lessonId).orElse(null);
            if (lesson == null) {
                log.warn("Skip lesson publish notify: lesson {} not found", lessonId);
                return;
            }

            Subject subject = resolveSubject(lesson);
            if (subject == null || subject.getClassroom() == null) {
                log.warn("Skip lesson publish notify: missing subject/classroom for lesson {}", lessonId);
                return;
            }

            Classroom classroom = subject.getClassroom();
            List<Enrollment> enrollments = enrollmentRepository
                    .findByClassroom_IdAndStatusIgnoreCaseAndVoidedFalse(classroom.getId(), ACTIVE_STATUS);
            if (enrollments.isEmpty()) {
                log.info("Lesson publish notify: no ACTIVE enrollments for lesson {}", lessonId);
                return;
            }

            String title = "Bài mới: " + trimOrEmpty(lesson.getTitle());
            String body = buildBody(subject.getName(), classroom.getName());
            String linkPath = STUDENT_LESSON_PATH_PREFIX + trimOrEmpty(lesson.getSlug());
            String payloadJson = buildPayloadJson(lesson, subject, classroom, actorUserId);

            List<Notification> batch = new ArrayList<>(BATCH_SIZE);
            int recipientCount = 0;

            for (Enrollment enrollment : enrollments) {
                if (enrollment.getStudent() == null || enrollment.getStudent().getId() == null) {
                    continue;
                }
                UUID studentId = enrollment.getStudent().getId();
                if (actorUserId != null && actorUserId.equals(studentId)) {
                    continue;
                }

                Notification row = new Notification();
                row.setUserId(studentId);
                row.setType(NotificationTypeEnum.LESSON_PUBLISHED);
                row.setTitle(title);
                row.setBody(body);
                row.setLinkPath(linkPath);
                row.setPayloadJson(payloadJson);
                batch.add(row);
                recipientCount++;

                if (batch.size() >= BATCH_SIZE) {
                    notificationRepository.saveAll(batch);
                    batch.clear();
                }
            }

            if (!batch.isEmpty()) {
                notificationRepository.saveAll(batch);
            }

            log.info(
                    "Lesson publish notify done: lessonId={}, recipients={}, ms={}",
                    lessonId,
                    recipientCount,
                    System.currentTimeMillis() - started);
        } catch (Exception ex) {
            log.error("Lesson publish notify failed for lesson {}", lessonId, ex);
        }
    }

    private Subject resolveSubject(Lesson lesson) {
        Subject subject = lesson.getSubject();
        if (subject != null && subject.getId() != null) {
            return subjectRepository.findByIdAndVoidedFalse(subject.getId()).orElse(subject);
        }
        return null;
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

    private String buildPayloadJson(
            Lesson lesson,
            Subject subject,
            Classroom classroom,
            UUID actorUserId) throws JsonProcessingException {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("lessonId", lesson.getId() != null ? lesson.getId().toString() : null);
        payload.put("lessonSlug", lesson.getSlug());
        payload.put("lessonTitle", lesson.getTitle());
        payload.put("coverImageUrl", trimOrEmpty(lesson.getCoverImageUrl()));
        payload.put("subjectId", subject.getId() != null ? subject.getId().toString() : null);
        payload.put("subjectName", subject.getName());
        payload.put("classroomId", classroom.getId() != null ? classroom.getId().toString() : null);
        payload.put("classroomName", classroom.getName());
        if (actorUserId != null) {
            payload.put("actorUserId", actorUserId.toString());
            User actor = userRepository.findByIdAndVoidedFalse(actorUserId).orElse(null);
            if (actor != null) {
                String actorName = trimOrEmpty(actor.getName());
                if (!actorName.isEmpty()) {
                    payload.put("actorName", actorName);
                }
                String actorAvatarUrl = trimOrEmpty(actor.getAvatarUrl());
                if (!actorAvatarUrl.isEmpty()) {
                    payload.put("actorAvatarUrl", actorAvatarUrl);
                }
            }
        }
        payload.values().removeIf(value -> value == null || (value instanceof String s && s.isEmpty()));
        return objectMapper.writeValueAsString(payload);
    }

    private String trimOrEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
