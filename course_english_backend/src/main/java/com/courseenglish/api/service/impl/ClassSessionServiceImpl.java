package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.ClassSession;
import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.Lesson;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.request.ReqClassSessionDTO;
import com.courseenglish.api.domain.request.ReqRecurringClassSessionDTO;
import com.courseenglish.api.domain.response.ResClassSessionDTO;
import com.courseenglish.api.domain.response.ResRecurringCreateDTO;
import com.courseenglish.api.domain.response.ResTeachingPlanDTO;
import com.courseenglish.api.domain.response.ResTeachingPlanSummaryDTO;
import com.courseenglish.api.repository.ClassSessionRepository;
import com.courseenglish.api.repository.ClassroomRepository;
import com.courseenglish.api.repository.EnrollmentRepository;
import com.courseenglish.api.repository.LessonRepository;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.service.ClassSessionService;
import com.courseenglish.api.service.SessionReminderSyncService;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.constant.RecurrenceScopeEnum;
import com.courseenglish.api.util.constant.SessionStatusEnum;
import com.courseenglish.api.util.constant.SessionTypeEnum;
import com.courseenglish.api.util.constant.SessionUiStateEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ClassSessionServiceImpl implements ClassSessionService {

    private static final ZoneId TEACHING_PLAN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final long JOIN_MEET_BUFFER_MINUTES = 15;
    private static final String ACTIVE_ENROLLMENT = "ACTIVE";
    private static final int MAX_RECURRING_SESSIONS = 100;

    private final ClassSessionRepository classSessionRepository;
    private final ClassroomRepository classroomRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SessionReminderSyncService sessionReminderSyncService;

    public ClassSessionServiceImpl(
            ClassSessionRepository classSessionRepository,
            ClassroomRepository classroomRepository,
            LessonRepository lessonRepository,
            UserRepository userRepository,
            EnrollmentRepository enrollmentRepository,
            SessionReminderSyncService sessionReminderSyncService) {
        this.classSessionRepository = classSessionRepository;
        this.classroomRepository = classroomRepository;
        this.lessonRepository = lessonRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.sessionReminderSyncService = sessionReminderSyncService;
    }

    @Override
    @Transactional(readOnly = true)
    public ResTeachingPlanDTO getTeachingPlanToday() throws IdInvalidException {
        return getTeachingPlanByDate(LocalDate.now(TEACHING_PLAN_ZONE));
    }

    @Override
    @Transactional(readOnly = true)
    public ResTeachingPlanDTO getTeachingPlanByDate(LocalDate date) throws IdInvalidException {
        UUID teacherId = requireCurrentUserId();
        Instant dayStart = date.atStartOfDay(TEACHING_PLAN_ZONE).toInstant();
        Instant dayEnd = date.plusDays(1).atStartOfDay(TEACHING_PLAN_ZONE).toInstant();

        List<ClassSession> sessions = classSessionRepository.findTeacherSessionsForDay(
                teacherId, dayStart, dayEnd, SessionStatusEnum.CANCELLED);

        ResTeachingPlanDTO plan = new ResTeachingPlanDTO();
        plan.setDate(date);
        plan.setSessions(sessions.stream().map(this::toDto).toList());
        plan.setSummary(buildSummary(sessions, date));
        return plan;
    }

    @Override
    @Transactional(readOnly = true)
    public ResTeachingPlanDTO getTeachingPlanRange(LocalDate from, LocalDate to) throws IdInvalidException {
        if (to.isBefore(from)) {
            throw new IdInvalidException("Ngày kết thúc phải sau ngày bắt đầu!");
        }
        UUID teacherId = requireCurrentUserId();
        Instant rangeStart = from.atStartOfDay(TEACHING_PLAN_ZONE).toInstant();
        Instant rangeEnd = to.plusDays(1).atStartOfDay(TEACHING_PLAN_ZONE).toInstant();

        List<ClassSession> sessions = classSessionRepository.findTeacherSessionsInRange(
                teacherId, rangeStart, rangeEnd, SessionStatusEnum.CANCELLED);

        ResTeachingPlanDTO plan = new ResTeachingPlanDTO();
        plan.setDate(from);
        plan.setSessions(sessions.stream().map(this::toDto).toList());
        plan.setSummary(buildSummaryForRange(sessions));
        return plan;
    }

    @Override
    @Transactional(readOnly = true)
    public ResClassSessionDTO getById(UUID id) throws IdInvalidException {
        ClassSession session = requireSession(id);
        assertCanAccessSession(session);
        return toDto(session);
    }

    @Override
    @Transactional
    public ResClassSessionDTO create(ReqClassSessionDTO request) throws IdInvalidException {
        UUID actorId = requireCurrentUserId();
        Classroom classroom = requireClassroom(request.getClassroomId());
        assertCanManageClassroom(classroom, actorId);

        validateTimes(request.getStartAt(), request.getEndAt());
        User teacher = requireTeacherFromClassroom(classroom);
        assertNoOverlap(teacher.getId(), request.getStartAt(), request.getEndAt(), null);

        ClassSession entity = new ClassSession();
        entity.setClassroom(classroom);
        entity.setTeacher(teacher);
        applyRequest(entity, request);

        ClassSession saved = classSessionRepository.save(entity);
        sessionReminderSyncService.syncForSession(saved);
        return toDto(saved);
    }

    @Override
    @Transactional
    public ResRecurringCreateDTO createRecurring(ReqRecurringClassSessionDTO request) throws IdInvalidException {
        UUID actorId = requireCurrentUserId();
        Classroom classroom = requireClassroom(request.getClassroomId());
        assertCanManageClassroom(classroom, actorId);
        User teacher = requireTeacherFromClassroom(classroom);

        validateRecurringRequest(request);
        LocalDate rangeEnd = resolveRangeEnd(request);
        if (rangeEnd.isBefore(request.getRangeStart())) {
            throw new IdInvalidException("Ngày kết thúc phải sau ngày bắt đầu!");
        }

        Instant startInstant = request.getRangeStart().atTime(request.getStartTime()).atZone(TEACHING_PLAN_ZONE).toInstant();
        Instant endInstant = request.getRangeStart().atTime(request.getEndTime()).atZone(TEACHING_PLAN_ZONE).toInstant();
        validateTimes(startInstant, endInstant);

        Set<Integer> weekdaySet = normalizeWeekdays(request.getWeekdays());
        UUID groupId = UUID.randomUUID();
        String recurrenceRule = buildRecurrenceRule(weekdaySet, request.getStartTime(), request.getEndTime());
        Lesson lesson = resolveLesson(request.getLessonId());

        List<ClassSession> toSave = new ArrayList<>();
        LocalDate cursor = request.getRangeStart();
        while (!cursor.isAfter(rangeEnd)) {
            if (weekdaySet.contains(cursor.getDayOfWeek().getValue())) {
                Instant sessionStart = cursor.atTime(request.getStartTime()).atZone(TEACHING_PLAN_ZONE).toInstant();
                Instant sessionEnd = cursor.atTime(request.getEndTime()).atZone(TEACHING_PLAN_ZONE).toInstant();
                assertNoOverlap(teacher.getId(), sessionStart, sessionEnd, null);

                ClassSession entity = new ClassSession();
                entity.setClassroom(classroom);
                entity.setTeacher(teacher);
                entity.setTitle(trimToEmpty(request.getTitle()));
                entity.setSessionType(request.getSessionType() != null ? request.getSessionType() : SessionTypeEnum.LIVE_CLASS);
                entity.setStartAt(sessionStart);
                entity.setEndAt(sessionEnd);
                entity.setMeetLink(trimNullable(request.getMeetLink()));
                entity.setLocationLabel(trimNullable(request.getLocationLabel()));
                entity.setNotes(trimNullable(request.getNotes()));
                entity.setLesson(lesson);
                entity.setRecurrenceGroupId(groupId);
                entity.setRecurrenceRule(recurrenceRule);
                toSave.add(entity);

                if (toSave.size() > MAX_RECURRING_SESSIONS) {
                    throw new IdInvalidException("Chuỗi lịch vượt quá " + MAX_RECURRING_SESSIONS + " buổi. Thu hẹp khoảng thời gian.");
                }
            }
            cursor = cursor.plusDays(1);
        }

        if (toSave.isEmpty()) {
            throw new IdInvalidException("Không có buổi dạy nào khớp ngày lặp trong khoảng thời gian đã chọn!");
        }

        List<ClassSession> saved = classSessionRepository.saveAll(toSave);
        saved.forEach(sessionReminderSyncService::syncForSession);
        ResRecurringCreateDTO response = new ResRecurringCreateDTO();
        response.setRecurrenceGroupId(groupId);
        response.setRecurrenceRule(recurrenceRule);
        response.setCreatedCount(saved.size());
        response.setSessions(saved.stream().limit(5).map(this::toDto).toList());
        return response;
    }

    @Override
    @Transactional
    public ResClassSessionDTO update(UUID id, ReqClassSessionDTO request) throws IdInvalidException {
        return update(id, request, RecurrenceScopeEnum.THIS_ONLY);
    }

    @Override
    @Transactional
    public ResClassSessionDTO update(UUID id, ReqClassSessionDTO request, RecurrenceScopeEnum scope)
            throws IdInvalidException {
        RecurrenceScopeEnum effectiveScope = scope != null ? scope : RecurrenceScopeEnum.THIS_ONLY;
        UUID actorId = requireCurrentUserId();
        ClassSession entity = requireSession(id);
        assertCanManageSession(entity, actorId);

        if (entity.getRecurrenceGroupId() != null && effectiveScope != RecurrenceScopeEnum.THIS_ONLY) {
            return updateRecurringSeries(entity, request, effectiveScope, actorId);
        }

        Classroom classroom = requireClassroom(request.getClassroomId());
        assertCanManageClassroom(classroom, actorId);
        validateTimes(request.getStartAt(), request.getEndAt());
        User teacher = requireTeacherFromClassroom(classroom);
        assertNoOverlap(teacher.getId(), request.getStartAt(), request.getEndAt(), entity.getId());

        entity.setClassroom(classroom);
        entity.setTeacher(teacher);
        applyRequest(entity, request);
        if (entity.getRecurrenceGroupId() != null && effectiveScope == RecurrenceScopeEnum.THIS_ONLY) {
            detachFromSeries(entity);
        }

        ClassSession saved = classSessionRepository.save(entity);
        sessionReminderSyncService.syncForSession(saved);
        return toDto(saved);
    }

    @Override
    @Transactional
    public ResClassSessionDTO cancel(UUID id) throws IdInvalidException {
        return cancel(id, RecurrenceScopeEnum.THIS_ONLY);
    }

    @Override
    @Transactional
    public ResClassSessionDTO cancel(UUID id, RecurrenceScopeEnum scope) throws IdInvalidException {
        RecurrenceScopeEnum effectiveScope = scope != null ? scope : RecurrenceScopeEnum.THIS_ONLY;
        UUID actorId = requireCurrentUserId();
        ClassSession entity = requireSession(id);
        assertCanManageSession(entity, actorId);

        if (entity.getRecurrenceGroupId() == null || effectiveScope == RecurrenceScopeEnum.THIS_ONLY) {
            entity.setStatus(SessionStatusEnum.CANCELLED);
            ClassSession saved = classSessionRepository.save(entity);
            sessionReminderSyncService.syncForSession(saved);
            return toDto(saved);
        }

        List<ClassSession> targets = resolveSeriesTargets(entity, effectiveScope);
        for (ClassSession session : targets) {
            assertCanManageSession(session, actorId);
            session.setStatus(SessionStatusEnum.CANCELLED);
        }
        classSessionRepository.saveAll(targets);
        targets.forEach(sessionReminderSyncService::syncForSession);
        return toDto(entity);
    }

    @Override
    @Transactional
    public void delete(UUID id) throws IdInvalidException {
        UUID actorId = requireCurrentUserId();
        ClassSession entity = requireSession(id);
        assertCanManageSession(entity, actorId);
        entity.setVoided(true);
        classSessionRepository.save(entity);
        sessionReminderSyncService.syncForSession(entity);
    }

    private void applyRequest(ClassSession entity, ReqClassSessionDTO request) throws IdInvalidException {
        entity.setTitle(trimToEmpty(request.getTitle()));
        entity.setSessionType(request.getSessionType() != null ? request.getSessionType() : SessionTypeEnum.LIVE_CLASS);
        entity.setStartAt(request.getStartAt());
        entity.setEndAt(request.getEndAt());
        entity.setMeetLink(trimNullable(request.getMeetLink()));
        entity.setLocationLabel(trimNullable(request.getLocationLabel()));
        entity.setNotes(trimNullable(request.getNotes()));
        entity.setLesson(resolveLesson(request.getLessonId()));
    }

    private Lesson resolveLesson(UUID lessonId) throws IdInvalidException {
        if (lessonId == null) {
            return null;
        }
        return lessonRepository.findByIdAndVoidedFalse(lessonId)
                .orElseThrow(() -> new IdInvalidException("Bài học không tồn tại!"));
    }

    private ResTeachingPlanSummaryDTO buildSummary(List<ClassSession> sessions, LocalDate date) {
        ResTeachingPlanSummaryDTO summary = new ResTeachingPlanSummaryDTO();
        summary.setSessionsToday(sessions.size());
        summary.setClassesToday((int) sessions.stream()
                .map(s -> s.getClassroom().getId())
                .distinct()
                .count());

        Instant now = Instant.now();
        Optional<ClassSession> next = sessions.stream()
                .filter(s -> s.getEndAt().isAfter(now))
                .min(Comparator.comparing(ClassSession::getStartAt));

        next.ifPresent(session -> fillNextSession(summary, session, now));
        return summary;
    }

    private ResTeachingPlanSummaryDTO buildSummaryForRange(List<ClassSession> sessions) {
        ResTeachingPlanSummaryDTO summary = new ResTeachingPlanSummaryDTO();
        summary.setSessionsToday(sessions.size());
        summary.setClassesToday((int) sessions.stream()
                .map(s -> s.getClassroom().getId())
                .distinct()
                .count());
        return summary;
    }

    private void fillNextSession(ResTeachingPlanSummaryDTO summary, ClassSession session, Instant now) {
        long minutes = Duration.between(now, session.getStartAt()).toMinutes();
        if (minutes < 0) {
            minutes = 0;
        }
        summary.setNextSessionInMinutes(minutes);
        Classroom classroom = session.getClassroom();
        String classroomName = classroom != null ? classroom.getName() : "";
        summary.setNextSessionTitle(classroomName + ": " + session.getTitle());
    }

    private ResClassSessionDTO toDto(ClassSession session) {
        Instant now = Instant.now();
        SessionUiStateEnum uiState = deriveUiState(session, now);
        boolean hasMeetLink = hasText(session.getMeetLink());
        boolean needsSetup = uiState != SessionUiStateEnum.PAST
                && session.getSessionType() == SessionTypeEnum.LIVE_CLASS
                && !hasMeetLink;

        ResClassSessionDTO dto = new ResClassSessionDTO();
        dto.setId(session.getId());
        dto.setTitle(session.getTitle());
        dto.setSessionType(session.getSessionType());
        dto.setStartAt(session.getStartAt());
        dto.setEndAt(session.getEndAt());
        dto.setMeetLink(session.getMeetLink());
        dto.setLocationLabel(session.getLocationLabel());
        dto.setStatus(session.getStatus());
        dto.setNotes(session.getNotes());
        dto.setUiState(needsSetup ? SessionUiStateEnum.NEEDS_SETUP : uiState);
        dto.setNeedsSetup(needsSetup);
        dto.setCanOpenLesson(session.getLesson() != null);

        if (session.getClassroom() != null) {
            dto.setClassroomId(session.getClassroom().getId());
            dto.setClassroomName(session.getClassroom().getName());
            dto.setClassroomCode(session.getClassroom().getCode());
            dto.setActiveStudentCount(enrollmentRepository.countByClassroom_IdAndStatusIgnoreCaseAndVoidedFalse(
                    session.getClassroom().getId(), ACTIVE_ENROLLMENT));
        }

        if (session.getTeacher() != null) {
            dto.setTeacherId(session.getTeacher().getId());
        }

        if (session.getLesson() != null) {
            dto.setLessonId(session.getLesson().getId());
            dto.setLessonTitle(session.getLesson().getTitle());
        }

        dto.setCanJoinMeet(canJoinMeet(session, now, hasMeetLink, uiState));
        dto.setRecurrenceGroupId(session.getRecurrenceGroupId());
        dto.setRecurrenceRule(session.getRecurrenceRule());
        dto.setRecurring(session.getRecurrenceGroupId() != null);
        return dto;
    }

    private SessionUiStateEnum deriveUiState(ClassSession session, Instant now) {
        if (session.getStatus() == SessionStatusEnum.CANCELLED) {
            return SessionUiStateEnum.PAST;
        }
        if (!now.isBefore(session.getStartAt()) && now.isBefore(session.getEndAt())) {
            return SessionUiStateEnum.LIVE;
        }
        if (now.isBefore(session.getStartAt())) {
            return SessionUiStateEnum.UPCOMING;
        }
        return SessionUiStateEnum.PAST;
    }

    private boolean canJoinMeet(ClassSession session, Instant now, boolean hasMeetLink, SessionUiStateEnum uiState) {
        if (!hasMeetLink || uiState == SessionUiStateEnum.PAST) {
            return false;
        }
        Instant joinFrom = session.getStartAt().minus(Duration.ofMinutes(JOIN_MEET_BUFFER_MINUTES));
        return !now.isBefore(joinFrom) && now.isBefore(session.getEndAt());
    }

    private void validateTimes(Instant startAt, Instant endAt) throws IdInvalidException {
        if (startAt == null || endAt == null) {
            throw new IdInvalidException("Thời gian bắt đầu và kết thúc là bắt buộc!");
        }
        if (!endAt.isAfter(startAt)) {
            throw new IdInvalidException("Giờ kết thúc phải sau giờ bắt đầu!");
        }
    }

    private void assertNoOverlap(UUID teacherId, Instant startAt, Instant endAt, UUID excludeId)
            throws IdInvalidException {
        if (classSessionRepository.existsOverlappingSession(
                teacherId, startAt, endAt, excludeId, SessionStatusEnum.CANCELLED)) {
            throw new IdInvalidException("Bạn đã có buổi dạy trùng khung giờ này!");
        }
    }

    private ClassSession requireSession(UUID id) throws IdInvalidException {
        return classSessionRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Buổi học không tồn tại!"));
    }

    private Classroom requireClassroom(UUID id) throws IdInvalidException {
        return classroomRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Lớp học không tồn tại!"));
    }

    private User requireTeacherFromClassroom(Classroom classroom) throws IdInvalidException {
        if (classroom.getTeacher() == null) {
            throw new IdInvalidException("Lớp học chưa gán giáo viên!");
        }
        return classroom.getTeacher();
    }

    private UUID requireCurrentUserId() throws IdInvalidException {
        return SercurityUtil.getCurrentUserId()
                .orElseThrow(() -> new IdInvalidException("Bạn cần đăng nhập để thực hiện thao tác này!"));
    }

    private void assertCanAccessSession(ClassSession session) throws IdInvalidException {
        UUID actorId = requireCurrentUserId();
        if (isAdmin(actorId)) {
            return;
        }
        if (session.getTeacher() != null && actorId.equals(session.getTeacher().getId())) {
            return;
        }
        throw new IdInvalidException("Bạn không có quyền xem buổi học này!");
    }

    private void assertCanManageSession(ClassSession session, UUID actorId) throws IdInvalidException {
        if (isAdmin(actorId)) {
            return;
        }
        if (session.getTeacher() != null && actorId.equals(session.getTeacher().getId())) {
            return;
        }
        throw new IdInvalidException("Bạn không có quyền quản lý buổi học này!");
    }

    private void assertCanManageClassroom(Classroom classroom, UUID actorId) throws IdInvalidException {
        if (isAdmin(actorId)) {
            return;
        }
        if (classroom.getTeacher() != null && actorId.equals(classroom.getTeacher().getId())) {
            return;
        }
        throw new IdInvalidException("Bạn không có quyền quản lý lớp học này!");
    }

    private boolean isAdmin(UUID userId) {
        return userRepository.findByIdAndVoidedFalse(userId)
                .map(user -> user.getRoles().stream()
                        .anyMatch(role -> "ADMIN_ROLE".equalsIgnoreCase(role.getName())
                                || "ADMIN_ROLE".equalsIgnoreCase(role.getCode())))
                .orElse(false);
    }

    private static String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private static String trimNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private void validateRecurringRequest(ReqRecurringClassSessionDTO request) throws IdInvalidException {
        if (request.getWeekdays() == null || request.getWeekdays().isEmpty()) {
            throw new IdInvalidException("Chọn ít nhất một ngày lặp trong tuần!");
        }
        if (request.getRangeEnd() == null && request.getWeekCount() == null) {
            throw new IdInvalidException("Chọn ngày kết thúc hoặc số tuần lặp!");
        }
        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new IdInvalidException("Giờ bắt đầu và kết thúc là bắt buộc!");
        }
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new IdInvalidException("Giờ kết thúc phải sau giờ bắt đầu!");
        }
    }

    private LocalDate resolveRangeEnd(ReqRecurringClassSessionDTO request) {
        if (request.getRangeEnd() != null) {
            return request.getRangeEnd();
        }
        int weeks = request.getWeekCount() != null ? request.getWeekCount() : 1;
        return request.getRangeStart().plusWeeks(weeks).minusDays(1);
    }

    private Set<Integer> normalizeWeekdays(List<Integer> weekdays) throws IdInvalidException {
        Set<Integer> normalized = new HashSet<>();
        for (Integer day : weekdays) {
            if (day == null || day < 1 || day > 7) {
                throw new IdInvalidException("Ngày lặp không hợp lệ (1=Thứ 2 … 7=Chủ nhật)!");
            }
            normalized.add(day);
        }
        return normalized;
    }

    private String buildRecurrenceRule(Set<Integer> weekdays, LocalTime startTime, LocalTime endTime) {
        String days = weekdays.stream()
                .sorted()
                .map(this::weekdayToCode)
                .collect(Collectors.joining(","));
        return "WEEKLY;" + days + ";" + startTime + "-" + endTime;
    }

    private String weekdayToCode(int isoDay) {
        return switch (isoDay) {
            case 1 -> "MO";
            case 2 -> "TU";
            case 3 -> "WE";
            case 4 -> "TH";
            case 5 -> "FR";
            case 6 -> "SA";
            default -> "SU";
        };
    }

    private ResClassSessionDTO updateRecurringSeries(
            ClassSession anchor,
            ReqClassSessionDTO request,
            RecurrenceScopeEnum scope,
            UUID actorId) throws IdInvalidException {
        List<ClassSession> targets = resolveSeriesTargets(anchor, scope);
        if (targets.isEmpty()) {
            throw new IdInvalidException("Không tìm thấy buổi dạy trong chuỗi lặp!");
        }
        Lesson lesson = resolveLesson(request.getLessonId());
        for (ClassSession session : targets) {
            assertCanManageSession(session, actorId);
            applyMetadata(session, request, lesson);
        }
        classSessionRepository.saveAll(targets);
        return toDto(anchor);
    }

    private void applyMetadata(ClassSession session, ReqClassSessionDTO request, Lesson lesson) {
        session.setTitle(trimToEmpty(request.getTitle()));
        session.setMeetLink(trimNullable(request.getMeetLink()));
        session.setLocationLabel(trimNullable(request.getLocationLabel()));
        session.setNotes(trimNullable(request.getNotes()));
        session.setLesson(lesson);
        if (request.getSessionType() != null) {
            session.setSessionType(request.getSessionType());
        }
    }

    private List<ClassSession> resolveSeriesTargets(ClassSession anchor, RecurrenceScopeEnum scope) {
        UUID groupId = anchor.getRecurrenceGroupId();
        if (groupId == null) {
            return List.of(anchor);
        }
        return switch (scope) {
            case ALL_IN_SERIES -> classSessionRepository.findByRecurrenceGroupIdAndVoidedFalseAndStatusNotOrderByStartAtAsc(
                    groupId, SessionStatusEnum.CANCELLED);
            case THIS_AND_FOLLOWING ->
                    classSessionRepository.findByRecurrenceGroupIdAndVoidedFalseAndStatusNotAndStartAtGreaterThanEqualOrderByStartAtAsc(
                            groupId, SessionStatusEnum.CANCELLED, anchor.getStartAt());
            default -> List.of(anchor);
        };
    }

    private void detachFromSeries(ClassSession entity) {
        entity.setRecurrenceGroupId(null);
        entity.setRecurrenceRule(null);
    }
}
