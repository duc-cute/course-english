package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.VocabularyPracticeAttempt;
import com.courseenglish.api.domain.VocabularySet;
import com.courseenglish.api.domain.VocabularySetAssignment;
import com.courseenglish.api.domain.request.ReqCreateVocabularyPracticeAttemptDTO;
import com.courseenglish.api.domain.request.ReqVocabularyPracticeSummaryDTO;
import com.courseenglish.api.domain.response.ResVocabularyPracticeAttemptBriefDTO;
import com.courseenglish.api.domain.response.ResVocabularyPracticeAttemptDTO;
import com.courseenglish.api.domain.response.ResVocabularyPracticeSummaryItemDTO;
import com.courseenglish.api.repository.EnrollmentRepository;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.repository.VocabularyPracticeAttemptRepository;
import com.courseenglish.api.repository.VocabularySetAssignmentRepository;
import com.courseenglish.api.repository.VocabularySetRepository;
import com.courseenglish.api.service.VocabularyPracticeAttemptService;
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
public class VocabularyPracticeAttemptServiceImpl implements VocabularyPracticeAttemptService {

    private static final String ASSIGNMENT_ACTIVE = "ACTIVE";

    private final VocabularyPracticeAttemptRepository attemptRepository;
    private final VocabularySetRepository vocabularySetRepository;
    private final VocabularySetAssignmentRepository assignmentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public VocabularyPracticeAttemptServiceImpl(
            VocabularyPracticeAttemptRepository attemptRepository,
            VocabularySetRepository vocabularySetRepository,
            VocabularySetAssignmentRepository assignmentRepository,
            EnrollmentRepository enrollmentRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper) {
        this.attemptRepository = attemptRepository;
        this.vocabularySetRepository = vocabularySetRepository;
        this.assignmentRepository = assignmentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public ResVocabularyPracticeAttemptDTO create(ReqCreateVocabularyPracticeAttemptDTO request)
            throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        UUID setId = request.getVocabularySetId();

        VocabularySet set = vocabularySetRepository
                .findByIdAndVoidedFalse(setId)
                .orElseThrow(() -> new IdInvalidException("Bộ từ vựng không tồn tại."));

        if (request.getTotalCount() < 1) {
            throw new IdInvalidException("totalCount phải >= 1.");
        }
        if (request.getCorrectCount() > request.getTotalCount()) {
            throw new IdInvalidException("correctCount không được lớn hơn totalCount.");
        }

        UUID assignmentId = null;
        if (request.getAssignmentId() != null) {
            VocabularySetAssignment assignment = assignmentRepository
                    .findByIdWithDetails(request.getAssignmentId())
                    .orElseThrow(() -> new IdInvalidException("Lần gán bộ từ không tồn tại."));
            if (assignment.isVoided() || !ASSIGNMENT_ACTIVE.equalsIgnoreCase(assignment.getStatus())) {
                throw new IdInvalidException("Lần gán bộ từ không còn hiệu lực.");
            }
            if (assignment.getVocabularySet() == null
                    || !set.getId().equals(assignment.getVocabularySet().getId())) {
                throw new IdInvalidException("assignmentId không khớp bộ từ đang luyện.");
            }
            UUID classroomId = assignment.getClassroom().getId();
            boolean enrolled = enrollmentRepository
                    .findActiveByClassroomAndStudent(classroomId, userId)
                    .isPresent();
            if (!enrolled) {
                throw new IdInvalidException("Bạn không thuộc lớp được giao bộ từ này.");
            }
            assignmentId = assignment.getId();
        }

        VocabularyPracticeAttempt attempt = new VocabularyPracticeAttempt();
        attempt.setUserId(userId);
        attempt.setVocabularySetId(set.getId());
        attempt.setAssignmentId(assignmentId);
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
        return toDto(attempt);
    }

    @Override
    @Transactional(readOnly = true)
    public ResVocabularyPracticeAttemptDTO getLatest(UUID vocabularySetId) throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        ensureSetExists(vocabularySetId);
        return attemptRepository
                .findFirstByUserIdAndVocabularySetIdAndVoidedFalseOrderByCompletedAtDesc(userId, vocabularySetId)
                .map(this::toDto)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public ResVocabularyPracticeAttemptDTO getBest(UUID vocabularySetId) throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        ensureSetExists(vocabularySetId);
        return attemptRepository
                .findFirstByUserIdAndVocabularySetIdAndVoidedFalseOrderByScorePercentDescCorrectCountDescCompletedAtDesc(
                        userId, vocabularySetId)
                .map(this::toDto)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResVocabularyPracticeAttemptDTO> listBySet(UUID vocabularySetId) throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        ensureSetExists(vocabularySetId);
        return attemptRepository
                .findByUserIdAndVocabularySetIdAndVoidedFalseOrderByCompletedAtDesc(userId, vocabularySetId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResVocabularyPracticeSummaryItemDTO> getSummary(ReqVocabularyPracticeSummaryDTO request)
            throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        List<UUID> setIds = request.getVocabularySetIds() == null
                ? Collections.emptyList()
                : request.getVocabularySetIds().stream().distinct().toList();
        if (setIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<VocabularyPracticeAttempt> attempts =
                attemptRepository.findByUserIdAndVocabularySetIdInAndVoidedFalse(userId, setIds);

        Map<UUID, List<VocabularyPracticeAttempt>> bySet = new HashMap<>();
        for (VocabularyPracticeAttempt attempt : attempts) {
            bySet.computeIfAbsent(attempt.getVocabularySetId(), k -> new ArrayList<>()).add(attempt);
        }

        List<ResVocabularyPracticeSummaryItemDTO> result = new ArrayList<>();
        for (UUID setId : setIds) {
            List<VocabularyPracticeAttempt> list = bySet.getOrDefault(setId, Collections.emptyList());
            if (list.isEmpty()) {
                continue;
            }

            VocabularyPracticeAttempt latest = list.stream()
                    .max(Comparator.comparing(VocabularyPracticeAttempt::getCompletedAt))
                    .orElse(null);
            VocabularyPracticeAttempt best = list.stream()
                    .max(Comparator
                            .comparingInt(VocabularyPracticeAttempt::getScorePercent)
                            .thenComparingInt(VocabularyPracticeAttempt::getCorrectCount)
                            .thenComparing(VocabularyPracticeAttempt::getCompletedAt))
                    .orElse(null);

            ResVocabularyPracticeSummaryItemDTO item = new ResVocabularyPracticeSummaryItemDTO();
            item.setVocabularySetId(setId);
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

    private void ensureSetExists(UUID vocabularySetId) throws IdInvalidException {
        vocabularySetRepository
                .findByIdAndVoidedFalse(vocabularySetId)
                .orElseThrow(() -> new IdInvalidException("Bộ từ vựng không tồn tại."));
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

    private ResVocabularyPracticeAttemptBriefDTO toBriefDto(VocabularyPracticeAttempt attempt) {
        ResVocabularyPracticeAttemptBriefDTO dto = new ResVocabularyPracticeAttemptBriefDTO();
        dto.setId(attempt.getId());
        dto.setVocabularySetId(attempt.getVocabularySetId());
        dto.setAssignmentId(attempt.getAssignmentId());
        dto.setCorrectCount(attempt.getCorrectCount());
        dto.setTotalCount(attempt.getTotalCount());
        dto.setScorePercent(attempt.getScorePercent());
        dto.setPassed(attempt.isPassed());
        dto.setPassScorePercent(attempt.getPassScorePercent());
        dto.setCompletedAt(attempt.getCompletedAt());
        return dto;
    }

    private ResVocabularyPracticeAttemptDTO toDto(VocabularyPracticeAttempt attempt) {
        ResVocabularyPracticeAttemptDTO dto = new ResVocabularyPracticeAttemptDTO();
        dto.setId(attempt.getId());
        dto.setUserId(attempt.getUserId());
        dto.setVocabularySetId(attempt.getVocabularySetId());
        dto.setAssignmentId(attempt.getAssignmentId());
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
