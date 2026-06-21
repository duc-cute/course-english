package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Lesson;
import com.courseenglish.api.domain.LessonPracticeAttempt;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.request.ReqCreateLessonPracticeAttemptDTO;
import com.courseenglish.api.domain.request.ReqLessonPracticeSummaryDTO;
import com.courseenglish.api.domain.response.ResLessonPracticeAttemptBriefDTO;
import com.courseenglish.api.domain.response.ResLessonPracticeAttemptDTO;
import com.courseenglish.api.domain.response.ResLessonPracticeSummaryItemDTO;
import com.courseenglish.api.repository.LessonPracticeAttemptRepository;
import com.courseenglish.api.repository.LessonRepository;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.service.LessonPracticeAttemptService;
import com.courseenglish.api.service.PracticeSubmittedNotificationService;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LessonPracticeAttemptServiceImpl implements LessonPracticeAttemptService {

    private final LessonPracticeAttemptRepository attemptRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final PracticeSubmittedNotificationService practiceSubmittedNotificationService;

    public LessonPracticeAttemptServiceImpl(
            LessonPracticeAttemptRepository attemptRepository,
            LessonRepository lessonRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper,
            PracticeSubmittedNotificationService practiceSubmittedNotificationService) {
        this.attemptRepository = attemptRepository;
        this.lessonRepository = lessonRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.practiceSubmittedNotificationService = practiceSubmittedNotificationService;
    }

    @Override
    @Transactional
    public ResLessonPracticeAttemptDTO create(ReqCreateLessonPracticeAttemptDTO request) throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        UUID lessonId = request.getLessonId();

        Lesson lesson = lessonRepository.findByIdAndVoidedFalse(lessonId)
                .orElseThrow(() -> new IdInvalidException("Bài học không tồn tại."));

        if (request.getTotalCount() < 1) {
            throw new IdInvalidException("totalCount phải >= 1.");
        }
        if (request.getCorrectCount() > request.getTotalCount()) {
            throw new IdInvalidException("correctCount không được lớn hơn totalCount.");
        }

        LessonPracticeAttempt attempt = new LessonPracticeAttempt();
        attempt.setUserId(userId);
        attempt.setLessonId(lesson.getId());
        attempt.setCorrectCount(request.getCorrectCount());
        attempt.setTotalCount(request.getTotalCount());
        attempt.setScorePercent(request.getScorePercent());
        attempt.setPassed(request.isPassed());
        attempt.setPassScorePercent(request.getPassScorePercent() > 0 ? request.getPassScorePercent() : 80);
        attempt.setElapsedMs(Math.max(0, request.getElapsedMs()));
        attempt.setBlockIdsJson(toJson(request.getBlockIds()));
        attempt.setAnswersSnapshotJson(toJson(request.getAnswersSnapshot()));
        attempt.setCompletedAt(Instant.now());

        attempt = attemptRepository.save(attempt);
        practiceSubmittedNotificationService.notifyPracticeSubmittedAsync(attempt.getId());
        return toDto(attempt);
    }

    @Override
    public ResLessonPracticeAttemptDTO getLatest(UUID lessonId) throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        ensureLessonExists(lessonId);
        return attemptRepository
                .findFirstByUserIdAndLessonIdAndVoidedFalseOrderByCompletedAtDesc(userId, lessonId)
                .map(this::toDto)
                .orElse(null);
    }

    @Override
    public ResLessonPracticeAttemptDTO getBest(UUID lessonId) throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        ensureLessonExists(lessonId);
        return attemptRepository
                .findFirstByUserIdAndLessonIdAndVoidedFalseOrderByScorePercentDescCorrectCountDescCompletedAtDesc(
                        userId, lessonId)
                .map(this::toDto)
                .orElse(null);
    }

    @Override
    public List<ResLessonPracticeAttemptDTO> listByLesson(UUID lessonId) throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        ensureLessonExists(lessonId);
        return attemptRepository.findByUserIdAndLessonIdAndVoidedFalseOrderByCompletedAtDesc(userId, lessonId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<ResLessonPracticeSummaryItemDTO> getSummary(ReqLessonPracticeSummaryDTO request)
            throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        List<UUID> lessonIds = request.getLessonIds() == null
                ? Collections.emptyList()
                : request.getLessonIds().stream().distinct().toList();
        if (lessonIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<LessonPracticeAttempt> attempts = attemptRepository
                .findByUserIdAndLessonIdInAndVoidedFalse(userId, lessonIds);

        Map<UUID, List<LessonPracticeAttempt>> byLesson = new HashMap<>();
        for (LessonPracticeAttempt attempt : attempts) {
            byLesson.computeIfAbsent(attempt.getLessonId(), k -> new ArrayList<>()).add(attempt);
        }

        List<ResLessonPracticeSummaryItemDTO> result = new ArrayList<>();
        for (UUID lessonId : lessonIds) {
            List<LessonPracticeAttempt> list = byLesson.getOrDefault(lessonId, Collections.emptyList());
            if (list.isEmpty()) {
                continue;
            }

            LessonPracticeAttempt latest = list.stream()
                    .max(Comparator.comparing(LessonPracticeAttempt::getCompletedAt))
                    .orElse(null);
            LessonPracticeAttempt best = list.stream()
                    .max(Comparator
                            .comparingInt(LessonPracticeAttempt::getScorePercent)
                            .thenComparingInt(LessonPracticeAttempt::getCorrectCount)
                            .thenComparing(LessonPracticeAttempt::getCompletedAt))
                    .orElse(null);

            ResLessonPracticeSummaryItemDTO item = new ResLessonPracticeSummaryItemDTO();
            item.setLessonId(lessonId);
            item.setAttemptCount(list.size());
            if (latest != null) {
                item.setLatest(toBriefDto(latest));
            }
            if (best != null) {
                item.setBest(toBriefDto(best));
            }
            result.add(item);
        }
        return result;
    }

    private void ensureLessonExists(UUID lessonId) throws IdInvalidException {
        lessonRepository.findByIdAndVoidedFalse(lessonId)
                .orElseThrow(() -> new IdInvalidException("Bài học không tồn tại."));
    }

    private UUID requireCurrentUserId() throws IdInvalidException {
        Optional<UUID> fromJwt = SercurityUtil.getCurrentUserId();
        if (fromJwt.isPresent()) {
            return fromJwt.get();
        }
        String email = SercurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new IdInvalidException("Cần đăng nhập để lưu điểm."));
        User user = userRepository.findByEmailAndVoidedFalse(email);
        if (user == null) {
            throw new IdInvalidException("Người dùng không tồn tại.");
        }
        return user.getId();
    }

    private ResLessonPracticeAttemptBriefDTO toBriefDto(LessonPracticeAttempt attempt) {
        ResLessonPracticeAttemptBriefDTO dto = new ResLessonPracticeAttemptBriefDTO();
        dto.setId(attempt.getId());
        dto.setLessonId(attempt.getLessonId());
        dto.setCorrectCount(attempt.getCorrectCount());
        dto.setTotalCount(attempt.getTotalCount());
        dto.setScorePercent(attempt.getScorePercent());
        dto.setPassed(attempt.isPassed());
        dto.setPassScorePercent(attempt.getPassScorePercent());
        dto.setCompletedAt(attempt.getCompletedAt());
        return dto;
    }

    private ResLessonPracticeAttemptDTO toDto(LessonPracticeAttempt attempt) {
        ResLessonPracticeAttemptDTO dto = new ResLessonPracticeAttemptDTO();
        dto.setId(attempt.getId());
        dto.setUserId(attempt.getUserId());
        dto.setLessonId(attempt.getLessonId());
        dto.setCorrectCount(attempt.getCorrectCount());
        dto.setTotalCount(attempt.getTotalCount());
        dto.setScorePercent(attempt.getScorePercent());
        dto.setPassed(attempt.isPassed());
        dto.setPassScorePercent(attempt.getPassScorePercent());
        dto.setElapsedMs(attempt.getElapsedMs());
        dto.setBlockIds(fromJsonList(attempt.getBlockIdsJson()));
        dto.setAnswersSnapshot(fromJsonMap(attempt.getAnswersSnapshotJson()));
        dto.setCompletedAt(attempt.getCompletedAt());
        dto.setCreatedAt(attempt.getCreatedAt());
        return dto;
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return null;
        }
    }

    private List<UUID> fromJsonList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<UUID>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private Map<String, Object> fromJsonMap(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }
}
