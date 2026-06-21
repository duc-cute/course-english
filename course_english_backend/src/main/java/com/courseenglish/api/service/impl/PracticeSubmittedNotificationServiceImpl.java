package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.Lesson;
import com.courseenglish.api.domain.LessonPracticeAttempt;
import com.courseenglish.api.domain.Notification;
import com.courseenglish.api.domain.Subject;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.repository.ClassroomRepository;
import com.courseenglish.api.repository.LessonPracticeAttemptRepository;
import com.courseenglish.api.repository.LessonRepository;
import com.courseenglish.api.repository.NotificationRepository;
import com.courseenglish.api.repository.SubjectRepository;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.service.PracticeSubmittedNotificationService;
import com.courseenglish.api.service.notification.NotificationPushService;
import com.courseenglish.api.util.constant.NotificationTypeEnum;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class PracticeSubmittedNotificationServiceImpl implements PracticeSubmittedNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PracticeSubmittedNotificationServiceImpl.class);
    private static final String ADMIN_LESSON_EDIT_PATH_PREFIX = "/admin/manage-lesson/";

    private final LessonPracticeAttemptRepository attemptRepository;
    private final LessonRepository lessonRepository;
    private final SubjectRepository subjectRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationPushService notificationPushService;
    private final ObjectMapper objectMapper;

    public PracticeSubmittedNotificationServiceImpl(
            LessonPracticeAttemptRepository attemptRepository,
            LessonRepository lessonRepository,
            SubjectRepository subjectRepository,
            ClassroomRepository classroomRepository,
            UserRepository userRepository,
            NotificationRepository notificationRepository,
            NotificationPushService notificationPushService,
            ObjectMapper objectMapper) {
        this.attemptRepository = attemptRepository;
        this.lessonRepository = lessonRepository;
        this.subjectRepository = subjectRepository;
        this.classroomRepository = classroomRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.notificationPushService = notificationPushService;
        this.objectMapper = objectMapper;
    }

    @Override
    @Async("notificationExecutor")
    @Transactional
    public void notifyPracticeSubmittedAsync(UUID attemptId) {
        if (attemptId == null) {
            return;
        }

        try {
            LessonPracticeAttempt attempt = attemptRepository.findById(attemptId).orElse(null);
            if (attempt == null || attempt.isVoided()) {
                log.warn("Skip practice submit notify: attempt {} not found", attemptId);
                return;
            }

            Lesson lesson = lessonRepository.findByIdAndVoidedFalse(attempt.getLessonId()).orElse(null);
            if (lesson == null) {
                log.warn("Skip practice submit notify: lesson {} not found", attempt.getLessonId());
                return;
            }

            User student = userRepository.findByIdAndVoidedFalse(attempt.getUserId()).orElse(null);
            if (student == null) {
                log.warn("Skip practice submit notify: student {} not found", attempt.getUserId());
                return;
            }

            User teacher = resolveTeacher(lesson).orElse(null);
            if (teacher == null || teacher.getId() == null) {
                log.info("Practice submit notify: no teacher resolved for lesson {}", lesson.getId());
                return;
            }

            if (teacher.getId().equals(student.getId())) {
                log.debug("Practice submit notify: skip self-submit lesson {}", lesson.getId());
                return;
            }

            String studentName = trimOrDefault(student.getName(), student.getEmail(), "Học sinh");
            String lessonTitle = trimOrEmpty(lesson.getTitle());
            String title = studentName + " vừa nộp bài tập";
            String body = buildBody(lessonTitle, attempt);
            String linkPath = ADMIN_LESSON_EDIT_PATH_PREFIX + lesson.getId() + "/edit";
            String payloadJson = buildPayloadJson(lesson, attempt, student);

            Notification row = new Notification();
            row.setUserId(teacher.getId());
            row.setType(NotificationTypeEnum.PRACTICE_SUBMITTED);
            row.setTitle(title);
            row.setBody(body);
            row.setLinkPath(linkPath);
            row.setPayloadJson(payloadJson);

            Notification saved = notificationRepository.save(row);
            notificationRepository.flush();
            notificationPushService.pushCreated(saved);

            log.info(
                    "Practice submit notify sent: attemptId={}, teacherId={}, studentId={}",
                    attemptId,
                    teacher.getId(),
                    student.getId());
        } catch (Exception ex) {
            log.error("Practice submit notify failed for attempt {}", attemptId, ex);
        }
    }

    private Optional<User> resolveTeacher(Lesson lesson) {
        String createdBy = trimOrEmpty(lesson.getCreatedBy());
        if (!createdBy.isEmpty()) {
            User author = userRepository.findByEmailAndVoidedFalse(createdBy);
            if (author != null) {
                return Optional.of(author);
            }
        }

        Subject subject = resolveSubject(lesson);
        if (subject == null) {
            return Optional.empty();
        }

        Classroom classroom = resolveClassroom(subject);
        if (classroom == null || classroom.getTeacherId() == null) {
            return Optional.empty();
        }

        return userRepository.findByIdAndVoidedFalse(classroom.getTeacherId());
    }

    private Subject resolveSubject(Lesson lesson) {
        Subject subject = lesson.getSubject();
        if (subject == null || subject.getId() == null) {
            return null;
        }
        return subjectRepository.findByIdAndVoidedFalse(subject.getId()).orElse(subject);
    }

    private Classroom resolveClassroom(Subject subject) {
        if (subject.getClassroom() == null || subject.getClassroom().getId() == null) {
            return null;
        }
        return classroomRepository.findByIdAndVoidedFalse(subject.getClassroom().getId()).orElse(null);
    }

    private String buildBody(String lessonTitle, LessonPracticeAttempt attempt) {
        String titlePart = lessonTitle.isEmpty() ? "Bài học" : lessonTitle;
        String resultPart = attempt.isPassed() ? "Đạt" : "Chưa đạt";
        return titlePart + " · " + attempt.getScorePercent() + "% · " + resultPart;
    }

    private String buildPayloadJson(Lesson lesson, LessonPracticeAttempt attempt, User student)
            throws JsonProcessingException {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("lessonId", lesson.getId() != null ? lesson.getId().toString() : null);
        payload.put("lessonSlug", lesson.getSlug());
        payload.put("lessonTitle", lesson.getTitle());
        payload.put("coverImageUrl", trimOrEmpty(lesson.getCoverImageUrl()));
        payload.put("attemptId", attempt.getId() != null ? attempt.getId().toString() : null);
        payload.put("studentUserId", student.getId() != null ? student.getId().toString() : null);
        payload.put("actorName", trimOrEmpty(student.getName()));
        payload.put("scorePercent", attempt.getScorePercent());
        payload.put("passed", attempt.isPassed());
        payload.put("correctCount", attempt.getCorrectCount());
        payload.put("totalCount", attempt.getTotalCount());
        String avatarUrl = trimOrEmpty(student.getAvatarUrl());
        if (!avatarUrl.isEmpty()) {
            payload.put("actorAvatarUrl", avatarUrl);
        }
        payload.values().removeIf(Objects::isNull);
        payload.values().removeIf(value -> value instanceof String s && s.isEmpty());
        return objectMapper.writeValueAsString(payload);
    }

    private String trimOrEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private String trimOrDefault(String primary, String fallback, String defaultValue) {
        String primaryTrimmed = trimOrEmpty(primary);
        if (!primaryTrimmed.isEmpty()) {
            return primaryTrimmed;
        }
        String fallbackTrimmed = trimOrEmpty(fallback);
        if (!fallbackTrimmed.isEmpty()) {
            return fallbackTrimmed;
        }
        return defaultValue;
    }
}
