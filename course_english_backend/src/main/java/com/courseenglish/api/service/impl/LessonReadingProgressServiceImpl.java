package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.LessonReadingProgress;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.request.ReqUpsertLessonReadingProgressDTO;
import com.courseenglish.api.domain.response.ResLessonReadingProgressDTO;
import com.courseenglish.api.repository.LessonReadingProgressRepository;
import com.courseenglish.api.repository.LessonRepository;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.service.LessonReadingProgressService;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class LessonReadingProgressServiceImpl implements LessonReadingProgressService {

    private final LessonReadingProgressRepository progressRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;

    public LessonReadingProgressServiceImpl(
            LessonReadingProgressRepository progressRepository,
            LessonRepository lessonRepository,
            UserRepository userRepository) {
        this.progressRepository = progressRepository;
        this.lessonRepository = lessonRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public ResLessonReadingProgressDTO upsert(UUID lessonId, ReqUpsertLessonReadingProgressDTO request)
            throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        lessonRepository.findByIdAndVoidedFalse(lessonId)
                .orElseThrow(() -> new IdInvalidException("Bài học không tồn tại."));

        String lastTab = normalizeTab(request.getLastTab());
        int scrollPercent = Math.max(0, Math.min(100, request.getScrollPercent()));

        LessonReadingProgress row = progressRepository
                .findByUserIdAndLessonIdAndVoidedFalse(userId, lessonId)
                .orElseGet(() -> {
                    LessonReadingProgress created = new LessonReadingProgress();
                    created.setUserId(userId);
                    created.setLessonId(lessonId);
                    return created;
                });

        row.setLastBlockId(trimToNull(request.getLastBlockId()));
        row.setScrollPercent(scrollPercent);
        row.setLastTab(lastTab);
        row.setLessonTitle(trimToNull(request.getLessonTitle()));
        row.setSubjectName(trimToNull(request.getSubjectName()));

        return toDto(progressRepository.save(row));
    }

    @Override
    public ResLessonReadingProgressDTO getByLesson(UUID lessonId) throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        return progressRepository.findByUserIdAndLessonIdAndVoidedFalse(userId, lessonId)
                .map(this::toDto)
                .orElse(null);
    }

    @Override
    public ResLessonReadingProgressDTO getContinue() throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        return progressRepository.findFirstByUserIdAndVoidedFalseOrderByUpdatedAtDesc(userId)
                .map(this::toDto)
                .orElse(null);
    }

    private String normalizeTab(String tab) {
        if ("practice".equalsIgnoreCase(tab)) {
            return "practice";
        }
        return "study";
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private UUID requireCurrentUserId() throws IdInvalidException {
        Optional<UUID> fromJwt = SercurityUtil.getCurrentUserId();
        if (fromJwt.isPresent()) {
            return fromJwt.get();
        }
        String email = SercurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new IdInvalidException("Cần đăng nhập để lưu tiến độ."));
        User user = userRepository.findByEmailAndVoidedFalse(email);
        if (user == null) {
            throw new IdInvalidException("Người dùng không tồn tại.");
        }
        return user.getId();
    }

    private ResLessonReadingProgressDTO toDto(LessonReadingProgress row) {
        ResLessonReadingProgressDTO dto = new ResLessonReadingProgressDTO();
        dto.setId(row.getId());
        dto.setUserId(row.getUserId());
        dto.setLessonId(row.getLessonId());
        dto.setLastBlockId(row.getLastBlockId());
        dto.setScrollPercent(row.getScrollPercent());
        dto.setLastTab(row.getLastTab());
        dto.setLessonTitle(row.getLessonTitle());
        dto.setSubjectName(row.getSubjectName());
        dto.setUpdatedAt(row.getUpdatedAt() != null ? row.getUpdatedAt() : row.getCreatedAt());
        return dto;
    }
}
