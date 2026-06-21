package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.Enrollment;
import com.courseenglish.api.domain.Lesson;
import com.courseenglish.api.domain.LessonPracticeAttempt;
import com.courseenglish.api.domain.LessonReadingProgress;
import com.courseenglish.api.domain.Subject;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.response.ResStudentSupportDetailDTO;
import com.courseenglish.api.domain.response.ResStudentSupportItemDTO;
import com.courseenglish.api.domain.response.ResStudentSupportLessonProgressDTO;
import com.courseenglish.api.domain.response.ResStudentSupportListDTO;
import com.courseenglish.api.domain.response.ResStudentSupportOverdueLessonDTO;
import com.courseenglish.api.domain.response.ResStudentSupportSummaryDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.ClassroomRepository;
import com.courseenglish.api.repository.EnrollmentRepository;
import com.courseenglish.api.repository.LessonPracticeAttemptRepository;
import com.courseenglish.api.repository.LessonReadingProgressRepository;
import com.courseenglish.api.repository.LessonRepository;
import com.courseenglish.api.repository.SubjectRepository;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.service.StudentSupportRiskService;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.constant.LessonStatusEnum;
import com.courseenglish.api.util.constant.StudentSupportRiskLevelEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StudentSupportRiskServiceImpl implements StudentSupportRiskService {

    private static final int INACTIVE_THRESHOLD_DAYS = 7;
    private static final int INACTIVE_POINTS = 50;
    private static final int MISSING_POINTS = 30;
    private static final int LOW_AVG_THRESHOLD = 60;
    private static final int LOW_AVG_POINTS = 25;
    private static final int SCORE_DECLINE_THRESHOLD = 15;
    private static final int SCORE_DECLINE_POINTS = 20;
    private static final int RISK_SCORE_CAP = 100;
    private static final int WIDGET_LIMIT = 3;

    private final ClassroomRepository classroomRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SubjectRepository subjectRepository;
    private final LessonRepository lessonRepository;
    private final LessonPracticeAttemptRepository attemptRepository;
    private final LessonReadingProgressRepository progressRepository;
    private final UserRepository userRepository;

    public StudentSupportRiskServiceImpl(
            ClassroomRepository classroomRepository,
            EnrollmentRepository enrollmentRepository,
            SubjectRepository subjectRepository,
            LessonRepository lessonRepository,
            LessonPracticeAttemptRepository attemptRepository,
            LessonReadingProgressRepository progressRepository,
            UserRepository userRepository) {
        this.classroomRepository = classroomRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.subjectRepository = subjectRepository;
        this.lessonRepository = lessonRepository;
        this.attemptRepository = attemptRepository;
        this.progressRepository = progressRepository;
        this.userRepository = userRepository;
    }

    @Override
    public ResStudentSupportSummaryDTO getSummary(UUID classroomId) throws IdInvalidException {
        List<ResStudentSupportItemDTO> atRisk = computeAtRiskItems(classroomId, null, null, null, null);
        return buildSummary(atRisk);
    }

    @Override
    public ResStudentSupportListDTO search(
            UUID classroomId,
            StudentSupportRiskLevelEnum riskLevel,
            Integer minInactiveDays,
            Integer minMissing,
            String keyword,
            int page,
            int size) throws IdInvalidException {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 20 : Math.min(size, 100);

        List<ResStudentSupportItemDTO> filtered = computeAtRiskItems(
                classroomId, riskLevel, minInactiveDays, minMissing, keyword);

        ResStudentSupportListDTO response = new ResStudentSupportListDTO();
        response.setSummary(buildSummary(filtered));

        int total = filtered.size();
        int from = Math.min(safePage * safeSize, total);
        int to = Math.min(from + safeSize, total);
        response.setItems(filtered.subList(from, to));

        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(safePage + 1);
        meta.setPageSize(safeSize);
        meta.setTotal(total);
        meta.setPages(safeSize == 0 ? 0 : (int) Math.ceil((double) total / safeSize));
        response.setMeta(meta);
        return response;
    }

    @Override
    public List<ResStudentSupportItemDTO> getWidget(UUID classroomId) throws IdInvalidException {
        List<ResStudentSupportItemDTO> atRisk = computeAtRiskItems(classroomId, null, null, null, null);
        return atRisk.stream().limit(WIDGET_LIMIT).toList();
    }

    @Override
    public ResStudentSupportDetailDTO getDetail(UUID studentId, UUID classroomId) throws IdInvalidException {
        if (studentId == null || classroomId == null) {
            throw new IdInvalidException("studentId và classroomId là bắt buộc!");
        }
        UUID actorId = requireCurrentUserId();
        Classroom classroom = classroomRepository.findByIdAndVoidedFalse(classroomId)
                .orElseThrow(() -> new IdInvalidException("Lớp học không tồn tại!"));
        assertCanAccessClassroom(classroom, actorId);

        Enrollment enrollment = enrollmentRepository
                .findActiveByClassroomAndStudent(classroomId, studentId)
                .orElseThrow(() -> new IdInvalidException("Học sinh không ghi danh ACTIVE trong lớp này!"));

        User student = enrollment.getStudent();
        if (student == null) {
            throw new IdInvalidException("Học sinh không tồn tại!");
        }

        List<Subject> subjects = subjectRepository.findByClassroom_IdInAndVoidedFalse(List.of(classroomId));
        Set<UUID> subjectIds = subjects.stream().map(Subject::getId).collect(Collectors.toSet());
        List<Lesson> classroomLessons = subjectIds.isEmpty()
                ? List.of()
                : lessonRepository.findBySubject_IdInAndStatusAndVoidedFalse(subjectIds, LessonStatusEnum.PUBLISHED);

        Set<UUID> lessonIds = classroomLessons.stream().map(Lesson::getId).collect(Collectors.toSet());
        List<LessonPracticeAttempt> attempts = lessonIds.isEmpty()
                ? List.of()
                : attemptRepository.findByUserIdAndLessonIdInAndVoidedFalse(studentId, new ArrayList<>(lessonIds));
        List<LessonReadingProgress> progressList = lessonIds.isEmpty()
                ? List.of()
                : progressRepository.findByUserIdAndLessonIdInAndVoidedFalse(studentId, lessonIds);

        Map<UUID, List<LessonPracticeAttempt>> attemptsByLesson = new HashMap<>();
        for (LessonPracticeAttempt attempt : attempts) {
            attemptsByLesson.computeIfAbsent(attempt.getLessonId(), k -> new ArrayList<>()).add(attempt);
        }
        Map<UUID, LessonReadingProgress> progressByLesson = new HashMap<>();
        for (LessonReadingProgress progress : progressList) {
            progressByLesson.put(progress.getLessonId(), progress);
        }

        Instant now = Instant.now();
        RiskComputation risk = computeRisk(
                enrollment,
                classroomLessons,
                lessonIds,
                attemptsByLesson,
                progressByLesson,
                now);

        List<ResStudentSupportLessonProgressDTO> overdue = new ArrayList<>();
        List<ResStudentSupportLessonProgressDTO> upcoming = new ArrayList<>();
        List<ResStudentSupportLessonProgressDTO> completed = new ArrayList<>();

        for (Lesson lesson : classroomLessons) {
            List<LessonPracticeAttempt> lessonAttempts = attemptsByLesson.get(lesson.getId());
            if (hasPassedAttempt(lessonAttempts)) {
                completed.add(toLessonProgressDto(lesson, lessonAttempts));
                continue;
            }
            if (lesson.getDueAt() == null) {
                continue;
            }
            if (lesson.getDueAt().isBefore(now)) {
                overdue.add(toLessonProgressDto(lesson, lessonAttempts));
            } else {
                upcoming.add(toLessonProgressDto(lesson, lessonAttempts));
            }
        }

        overdue.sort(Comparator.comparing(ResStudentSupportLessonProgressDTO::getDueAt,
                Comparator.nullsLast(Comparator.naturalOrder())));
        upcoming.sort(Comparator.comparing(ResStudentSupportLessonProgressDTO::getDueAt,
                Comparator.nullsLast(Comparator.naturalOrder())));
        completed.sort(Comparator.comparing(
                ResStudentSupportLessonProgressDTO::getCompletedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));

        ResStudentSupportDetailDTO detail = new ResStudentSupportDetailDTO();
        detail.setProfile(toItemDto(student, classroom, risk));
        detail.setOverdueLessons(overdue);
        detail.setUpcomingLessons(upcoming);
        detail.setCompletedLessons(completed);
        return detail;
    }

    private ResStudentSupportLessonProgressDTO toLessonProgressDto(
            Lesson lesson,
            List<LessonPracticeAttempt> attempts) {
        ResStudentSupportLessonProgressDTO dto = new ResStudentSupportLessonProgressDTO();
        dto.setLessonId(lesson.getId());
        dto.setTitle(lesson.getTitle());
        dto.setSlug(lesson.getSlug());
        dto.setDueAt(lesson.getDueAt());
        dto.setPassed(false);
        if (attempts == null || attempts.isEmpty()) {
            return dto;
        }
        LessonPracticeAttempt bestAny = attempts.stream()
                .max(Comparator
                        .comparingInt(LessonPracticeAttempt::getScorePercent)
                        .thenComparing(LessonPracticeAttempt::getCompletedAt))
                .orElse(null);
        if (bestAny != null) {
            dto.setBestScorePercent(bestAny.getScorePercent());
            dto.setCompletedAt(bestAny.getCompletedAt());
        }
        attempts.stream()
                .filter(LessonPracticeAttempt::isPassed)
                .max(Comparator.comparing(LessonPracticeAttempt::getCompletedAt))
                .ifPresent(passed -> {
                    dto.setPassed(true);
                    dto.setCompletedAt(passed.getCompletedAt());
                    int bestPassedScore = attempts.stream()
                            .filter(LessonPracticeAttempt::isPassed)
                            .mapToInt(LessonPracticeAttempt::getScorePercent)
                            .max()
                            .orElse(passed.getScorePercent());
                    dto.setBestScorePercent(bestPassedScore);
                });
        return dto;
    }

    private List<ResStudentSupportItemDTO> computeAtRiskItems(
            UUID classroomId,
            StudentSupportRiskLevelEnum riskLevel,
            Integer minInactiveDays,
            Integer minMissing,
            String keyword) throws IdInvalidException {
        UUID actorId = requireCurrentUserId();
        List<Classroom> classrooms = resolveAccessibleClassrooms(actorId, classroomId);
        if (classrooms.isEmpty()) {
            return List.of();
        }

        Set<UUID> classroomIds = classrooms.stream().map(Classroom::getId).collect(Collectors.toSet());
        List<Enrollment> enrollments = classroomIds.isEmpty()
                ? List.of()
                : enrollmentRepository.findActiveByClassroomIdsWithStudent(classroomIds);

        if (enrollments.isEmpty()) {
            return List.of();
        }

        List<Subject> subjects = subjectRepository.findByClassroom_IdInAndVoidedFalse(classroomIds);
        Map<UUID, UUID> subjectToClassroom = new HashMap<>();
        for (Subject subject : subjects) {
            if (subject.getClassroom() != null) {
                subjectToClassroom.put(subject.getId(), subject.getClassroom().getId());
            }
        }

        Set<UUID> subjectIds = subjectToClassroom.keySet();
        List<Lesson> lessons = subjectIds.isEmpty()
                ? List.of()
                : lessonRepository.findBySubject_IdInAndStatusAndVoidedFalse(subjectIds, LessonStatusEnum.PUBLISHED);

        Map<UUID, List<Lesson>> lessonsByClassroom = new HashMap<>();
        Map<UUID, Lesson> lessonById = new HashMap<>();
        for (Lesson lesson : lessons) {
            lessonById.put(lesson.getId(), lesson);
            UUID subjectId = lesson.getSubject() != null ? lesson.getSubject().getId() : null;
            UUID clsId = subjectId != null ? subjectToClassroom.get(subjectId) : null;
            if (clsId != null) {
                lessonsByClassroom.computeIfAbsent(clsId, k -> new ArrayList<>()).add(lesson);
            }
        }

        Set<UUID> lessonIds = lessonById.keySet();
        List<LessonPracticeAttempt> allAttempts = lessonIds.isEmpty()
                ? List.of()
                : attemptRepository.findByLessonIdInAndVoidedFalse(lessonIds);
        List<LessonReadingProgress> allProgress = lessonIds.isEmpty()
                ? List.of()
                : progressRepository.findByLessonIdInAndVoidedFalse(lessonIds);

        Map<UUID, Map<UUID, List<LessonPracticeAttempt>>> attemptsByUserLesson = groupAttempts(allAttempts);
        Map<UUID, Map<UUID, LessonReadingProgress>> progressByUserLesson = groupProgress(allProgress);

        Instant now = Instant.now();
        List<ResStudentSupportItemDTO> items = new ArrayList<>();

        for (Enrollment enrollment : enrollments) {
            User student = enrollment.getStudent();
            Classroom classroom = enrollment.getClassroom();
            if (student == null || classroom == null) {
                continue;
            }

            List<Lesson> classroomLessons = lessonsByClassroom.getOrDefault(classroom.getId(), List.of());
            Set<UUID> classroomLessonIds = classroomLessons.stream().map(Lesson::getId).collect(Collectors.toSet());

            Map<UUID, List<LessonPracticeAttempt>> userAttempts = attemptsByUserLesson
                    .getOrDefault(student.getId(), Map.of());
            Map<UUID, LessonReadingProgress> userProgress = progressByUserLesson
                    .getOrDefault(student.getId(), Map.of());

            RiskComputation risk = computeRisk(
                    enrollment,
                    classroomLessons,
                    classroomLessonIds,
                    userAttempts,
                    userProgress,
                    now);

            if (risk.riskScore < 20) {
                continue;
            }

            ResStudentSupportItemDTO item = toItemDto(student, classroom, risk);
            items.add(item);
        }

        items.sort(Comparator
                .comparingInt(ResStudentSupportItemDTO::getRiskScore).reversed()
                .thenComparingInt(ResStudentSupportItemDTO::getInactiveDays).reversed()
                .thenComparing(ResStudentSupportItemDTO::getStudentName, String.CASE_INSENSITIVE_ORDER));

        return applyFilters(items, riskLevel, minInactiveDays, minMissing, keyword);
    }

    private RiskComputation computeRisk(
            Enrollment enrollment,
            List<Lesson> classroomLessons,
            Set<UUID> classroomLessonIds,
            Map<UUID, List<LessonPracticeAttempt>> userAttempts,
            Map<UUID, LessonReadingProgress> userProgress,
            Instant now) {
        Instant lastActivityAt = resolveLastActivityAt(
                classroomLessonIds, userAttempts, userProgress, enrollment.getJoinedAt());

        int inactiveDays = (int) ChronoUnit.DAYS.between(lastActivityAt, now);
        if (inactiveDays < 0) {
            inactiveDays = 0;
        }

        List<Lesson> overdueLessons = new ArrayList<>();
        for (Lesson lesson : classroomLessons) {
            if (lesson.getDueAt() == null || !lesson.getDueAt().isBefore(now)) {
                continue;
            }
            if (!hasPassedAttempt(userAttempts.get(lesson.getId()))) {
                overdueLessons.add(lesson);
            }
        }
        overdueLessons.sort(Comparator.comparing(Lesson::getDueAt, Comparator.nullsLast(Comparator.naturalOrder())));

        int missingCount = overdueLessons.size();

        List<Integer> bestScores = new ArrayList<>();
        List<LessonScorePoint> scoreTimeline = new ArrayList<>();

        for (UUID lessonId : classroomLessonIds) {
            List<LessonPracticeAttempt> attempts = userAttempts.get(lessonId);
            if (attempts == null || attempts.isEmpty()) {
                continue;
            }
            LessonPracticeAttempt best = attempts.stream()
                    .max(Comparator
                            .comparingInt(LessonPracticeAttempt::getScorePercent)
                            .thenComparingInt(LessonPracticeAttempt::getCorrectCount)
                            .thenComparing(LessonPracticeAttempt::getCompletedAt))
                    .orElse(null);
            if (best == null) {
                continue;
            }
            bestScores.add(best.getScorePercent());
            LessonPracticeAttempt latest = attempts.stream()
                    .max(Comparator.comparing(LessonPracticeAttempt::getCompletedAt))
                    .orElse(best);
            scoreTimeline.add(new LessonScorePoint(latest.getCompletedAt(), best.getScorePercent()));
        }

        Integer avgScore = null;
        if (!bestScores.isEmpty()) {
            int sum = bestScores.stream().mapToInt(Integer::intValue).sum();
            avgScore = Math.round((float) sum / bestScores.size());
        }

        Integer trendPercent = null;
        scoreTimeline.sort(Comparator.comparing(LessonScorePoint::completedAt).reversed());
        if (scoreTimeline.size() >= 6) {
            double recentAvg = averageOf(scoreTimeline, 0, 3);
            double previousAvg = averageOf(scoreTimeline, 3, 3);
            trendPercent = (int) Math.round(recentAvg - previousAvg);
        }

        int riskScore = 0;
        List<ReasonPart> reasons = new ArrayList<>();

        if (inactiveDays > INACTIVE_THRESHOLD_DAYS) {
            riskScore += INACTIVE_POINTS;
            reasons.add(new ReasonPart("INACTIVE_7D", INACTIVE_POINTS,
                    "No activity: " + inactiveDays + " days"));
        }
        if (missingCount > 0) {
            riskScore += MISSING_POINTS;
            reasons.add(new ReasonPart("MISSING_ASSIGNMENTS", MISSING_POINTS,
                    missingCount + " Missing assignments"));
        }
        if (avgScore != null && avgScore < LOW_AVG_THRESHOLD) {
            riskScore += LOW_AVG_POINTS;
            reasons.add(new ReasonPart("LOW_AVG_SCORE", LOW_AVG_POINTS, "Low Performance"));
        }
        if (trendPercent != null && trendPercent <= -SCORE_DECLINE_THRESHOLD) {
            riskScore += SCORE_DECLINE_POINTS;
            reasons.add(new ReasonPart("SCORE_DECLINE", SCORE_DECLINE_POINTS,
                    "Score dropped: " + trendPercent + "%"));
        }

        riskScore = Math.min(riskScore, RISK_SCORE_CAP);
        reasons.sort(Comparator.comparingInt(ReasonPart::points).reversed());

        RiskComputation result = new RiskComputation();
        result.inactiveDays = inactiveDays;
        result.missingCount = missingCount;
        result.overdueLessons = overdueLessons;
        result.avgScore = avgScore;
        result.trendPercent = trendPercent;
        result.riskScore = riskScore;
        result.riskLevel = resolveRiskLevel(riskScore);
        result.reasonCodes = reasons.stream().map(ReasonPart::code).toList();
        result.primaryReason = buildPrimaryReason(reasons);
        return result;
    }

    private static String buildPrimaryReason(List<ReasonPart> reasons) {
        if (reasons.isEmpty()) {
            return "";
        }
        List<String> labels = new ArrayList<>();
        for (int i = 0; i < Math.min(2, reasons.size()); i++) {
            switch (reasons.get(i).code()) {
                case "INACTIVE_7D" -> labels.add("Inactive");
                case "MISSING_ASSIGNMENTS" -> labels.add("Missing Homework");
                case "LOW_AVG_SCORE" -> labels.add("Low Performance");
                case "SCORE_DECLINE" -> labels.add(reasons.get(i).label());
                default -> labels.add(reasons.get(i).label());
            }
        }
        if (labels.size() == 2 && "Inactive".equals(labels.get(0)) && "Missing Homework".equals(labels.get(1))) {
            return "Inactive + Missing Homework";
        }
        if (labels.size() == 1) {
            return labels.get(0);
        }
        return String.join(" + ", labels);
    }

    private static double averageOf(List<LessonScorePoint> points, int offset, int count) {
        double sum = 0;
        for (int i = offset; i < offset + count && i < points.size(); i++) {
            sum += points.get(i).scorePercent();
        }
        return sum / count;
    }

    private static boolean hasPassedAttempt(List<LessonPracticeAttempt> attempts) {
        if (attempts == null || attempts.isEmpty()) {
            return false;
        }
        return attempts.stream().anyMatch(LessonPracticeAttempt::isPassed);
    }

    private static Instant resolveLastActivityAt(
            Set<UUID> lessonIds,
            Map<UUID, List<LessonPracticeAttempt>> userAttempts,
            Map<UUID, LessonReadingProgress> userProgress,
            Instant joinedAt) {
        Instant last = joinedAt != null ? joinedAt : Instant.EPOCH;
        for (UUID lessonId : lessonIds) {
            List<LessonPracticeAttempt> attempts = userAttempts.get(lessonId);
            if (attempts != null) {
                for (LessonPracticeAttempt attempt : attempts) {
                    if (attempt.getCompletedAt() != null && attempt.getCompletedAt().isAfter(last)) {
                        last = attempt.getCompletedAt();
                    }
                }
            }
            LessonReadingProgress progress = userProgress.get(lessonId);
            if (progress != null && progress.getUpdatedAt() != null && progress.getUpdatedAt().isAfter(last)) {
                last = progress.getUpdatedAt();
            }
        }
        return last;
    }

    private static Map<UUID, Map<UUID, List<LessonPracticeAttempt>>> groupAttempts(
            List<LessonPracticeAttempt> attempts) {
        Map<UUID, Map<UUID, List<LessonPracticeAttempt>>> result = new HashMap<>();
        for (LessonPracticeAttempt attempt : attempts) {
            result.computeIfAbsent(attempt.getUserId(), k -> new HashMap<>())
                    .computeIfAbsent(attempt.getLessonId(), k -> new ArrayList<>())
                    .add(attempt);
        }
        return result;
    }

    private static Map<UUID, Map<UUID, LessonReadingProgress>> groupProgress(
            List<LessonReadingProgress> progressList) {
        Map<UUID, Map<UUID, LessonReadingProgress>> result = new HashMap<>();
        for (LessonReadingProgress progress : progressList) {
            result.computeIfAbsent(progress.getUserId(), k -> new HashMap<>())
                    .put(progress.getLessonId(), progress);
        }
        return result;
    }

    private ResStudentSupportItemDTO toItemDto(User student, Classroom classroom, RiskComputation risk) {
        ResStudentSupportItemDTO dto = new ResStudentSupportItemDTO();
        dto.setStudentId(student.getId());
        dto.setStudentName(student.getName());
        dto.setAvatarUrl(student.getAvatarUrl());
        dto.setClassroomId(classroom.getId());
        dto.setClassroomName(classroom.getName());
        dto.setRiskLevel(risk.riskLevel);
        dto.setRiskScore(risk.riskScore);
        dto.setInactiveDays(risk.inactiveDays);
        dto.setMissingAssignments(risk.missingCount);
        dto.setAvgScorePercent(risk.avgScore);
        dto.setScoreTrendPercent(risk.trendPercent);
        dto.setPrimaryReason(risk.primaryReason);
        dto.setReasonCodes(new ArrayList<>(risk.reasonCodes));
        dto.setOverdueLessons(risk.overdueLessons.stream().map(lesson -> {
            ResStudentSupportOverdueLessonDTO overdue = new ResStudentSupportOverdueLessonDTO();
            overdue.setLessonId(lesson.getId());
            overdue.setTitle(lesson.getTitle());
            overdue.setDueAt(lesson.getDueAt());
            return overdue;
        }).toList());
        return dto;
    }

    private static StudentSupportRiskLevelEnum resolveRiskLevel(int riskScore) {
        if (riskScore >= 70) {
            return StudentSupportRiskLevelEnum.CRITICAL;
        }
        if (riskScore >= 40) {
            return StudentSupportRiskLevelEnum.WARNING;
        }
        return StudentSupportRiskLevelEnum.ATTENTION;
    }

    private static ResStudentSupportSummaryDTO buildSummary(List<ResStudentSupportItemDTO> items) {
        ResStudentSupportSummaryDTO summary = new ResStudentSupportSummaryDTO();
        long critical = 0;
        long warning = 0;
        long attention = 0;
        for (ResStudentSupportItemDTO item : items) {
            if (item.getRiskLevel() == StudentSupportRiskLevelEnum.CRITICAL) {
                critical++;
            } else if (item.getRiskLevel() == StudentSupportRiskLevelEnum.WARNING) {
                warning++;
            } else if (item.getRiskLevel() == StudentSupportRiskLevelEnum.ATTENTION) {
                attention++;
            }
        }
        summary.setCriticalCount(critical);
        summary.setWarningCount(warning);
        summary.setAttentionCount(attention);
        summary.setTotalAtRisk(items.size());
        return summary;
    }

    private static List<ResStudentSupportItemDTO> applyFilters(
            List<ResStudentSupportItemDTO> items,
            StudentSupportRiskLevelEnum riskLevel,
            Integer minInactiveDays,
            Integer minMissing,
            String keyword) {
        String kw = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);
        return items.stream()
                .filter(item -> riskLevel == null || item.getRiskLevel() == riskLevel)
                .filter(item -> minInactiveDays == null || item.getInactiveDays() >= minInactiveDays)
                .filter(item -> minMissing == null || item.getMissingAssignments() >= minMissing)
                .filter(item -> kw.isEmpty()
                        || (item.getStudentName() != null && item.getStudentName().toLowerCase(Locale.ROOT).contains(kw))
                        || (item.getClassroomName() != null && item.getClassroomName().toLowerCase(Locale.ROOT).contains(kw)))
                .toList();
    }

    private List<Classroom> resolveAccessibleClassrooms(UUID actorId, UUID classroomId) throws IdInvalidException {
        if (classroomId != null) {
            Classroom classroom = classroomRepository.findByIdAndVoidedFalse(classroomId)
                    .orElseThrow(() -> new IdInvalidException("Lớp học không tồn tại!"));
            assertCanAccessClassroom(classroom, actorId);
            return List.of(classroom);
        }
        if (isAdmin(actorId)) {
            return classroomRepository.findByVoidedFalse();
        }
        return classroomRepository.findByTeacher_IdAndVoidedFalse(actorId);
    }

    private void assertCanAccessClassroom(Classroom classroom, UUID actorId) throws IdInvalidException {
        if (isAdmin(actorId)) {
            return;
        }
        if (classroom.getTeacher() != null && actorId.equals(classroom.getTeacher().getId())) {
            return;
        }
        throw new IdInvalidException("Bạn không có quyền xem học sinh của lớp này!");
    }

    private UUID requireCurrentUserId() throws IdInvalidException {
        return SercurityUtil.getCurrentUserId()
                .orElseThrow(() -> new IdInvalidException("Bạn cần đăng nhập để thực hiện thao tác này!"));
    }

    private boolean isAdmin(UUID userId) {
        return userRepository.findByIdAndVoidedFalse(userId)
                .map(user -> user.getRoles().stream()
                        .anyMatch(role -> "ADMIN_ROLE".equalsIgnoreCase(role.getName())
                                || "ADMIN_ROLE".equalsIgnoreCase(role.getCode())))
                .orElse(false);
    }

    private static final class RiskComputation {
        private int inactiveDays;
        private int missingCount;
        private List<Lesson> overdueLessons = List.of();
        private Integer avgScore;
        private Integer trendPercent;
        private int riskScore;
        private StudentSupportRiskLevelEnum riskLevel;
        private String primaryReason;
        private List<String> reasonCodes = List.of();
    }

    private record ReasonPart(String code, int points, String label) {
    }

    private record LessonScorePoint(Instant completedAt, int scorePercent) {
    }
}
