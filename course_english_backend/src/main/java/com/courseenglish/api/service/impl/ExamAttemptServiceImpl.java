package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.ExamAssignment;
import com.courseenglish.api.domain.ExamAttempt;
import com.courseenglish.api.domain.ExamPaper;
import com.courseenglish.api.domain.ExamSection;
import com.courseenglish.api.domain.request.ReqStartExamAttemptDTO;
import com.courseenglish.api.domain.request.ReqSubmitExamAttemptDTO;
import com.courseenglish.api.domain.response.ResExamAttemptDTO;
import com.courseenglish.api.repository.EnrollmentRepository;
import com.courseenglish.api.repository.ExamAssignmentRepository;
import com.courseenglish.api.repository.ExamAttemptRepository;
import com.courseenglish.api.repository.ExamSectionRepository;
import com.courseenglish.api.service.ExamAttemptService;
import com.courseenglish.api.service.StudentEnrollmentAccessService;
import com.courseenglish.api.service.exam.ExamAttemptScoringService;
import com.courseenglish.api.util.constant.ExamAssignmentStatusEnum;
import com.courseenglish.api.util.constant.ExamAttemptStatusEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ExamAttemptServiceImpl implements ExamAttemptService {

    private final ExamAttemptRepository attemptRepository;
    private final ExamAssignmentRepository assignmentRepository;
    private final ExamSectionRepository examSectionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentEnrollmentAccessService enrollmentAccessService;
    private final ExamAttemptScoringService scoringService;
    private final ObjectMapper objectMapper;

    public ExamAttemptServiceImpl(
            ExamAttemptRepository attemptRepository,
            ExamAssignmentRepository assignmentRepository,
            ExamSectionRepository examSectionRepository,
            EnrollmentRepository enrollmentRepository,
            StudentEnrollmentAccessService enrollmentAccessService,
            ExamAttemptScoringService scoringService,
            ObjectMapper objectMapper) {
        this.attemptRepository = attemptRepository;
        this.assignmentRepository = assignmentRepository;
        this.examSectionRepository = examSectionRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.enrollmentAccessService = enrollmentAccessService;
        this.scoringService = scoringService;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public ResExamAttemptDTO start(ReqStartExamAttemptDTO request) throws IdInvalidException {
        UUID studentId = enrollmentAccessService
                .currentStudentId()
                .orElseThrow(() -> new IdInvalidException("Cần đăng nhập"));

        ExamAssignment assignment = assignmentRepository
                .findByIdWithDetails(request.getAssignmentId())
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy đề được giao"));

        if (assignment.getStatus() != ExamAssignmentStatusEnum.ACTIVE || assignment.isVoided()) {
            throw new IdInvalidException("Đề được giao không còn hiệu lực");
        }

        boolean enrolled = enrollmentRepository
                .findActiveByClassroomAndStudent(assignment.getClassroom().getId(), studentId)
                .isPresent();
        if (!enrolled) {
            throw new IdInvalidException("Bạn không thuộc lớp được giao đề này");
        }

        Instant now = Instant.now();
        if (!ExamAssignmentServiceImpl.isWindowOpen(assignment, now)) {
            throw new IdInvalidException("Chưa đến giờ làm bài hoặc đã hết hạn làm đề");
        }

        ExamAttempt inProgress = attemptRepository
                .findFirstByAssignment_IdAndUserIdAndStatusAndVoidedFalseOrderByAttemptNoDesc(
                        assignment.getId(), studentId, ExamAttemptStatusEnum.IN_PROGRESS)
                .orElse(null);
        if (inProgress != null) {
            return ExamAssignmentServiceImpl.toAttemptDto(inProgress);
        }

        long finished = attemptRepository.countByAssignment_IdAndUserIdAndStatusInAndVoidedFalse(
                assignment.getId(),
                studentId,
                List.of(ExamAttemptStatusEnum.SUBMITTED, ExamAttemptStatusEnum.TIMED_OUT));
        if (finished >= assignment.getMaxAttempts()) {
            throw new IdInvalidException("Bạn đã hết số lần làm bài cho đề này");
        }

        int nextNo = attemptRepository
                .findFirstByAssignment_IdAndUserIdAndVoidedFalseOrderByAttemptNoDesc(
                        assignment.getId(), studentId)
                .map(a -> a.getAttemptNo() + 1)
                .orElse(1);

        ExamPaper paper = assignment.getExamPaper();
        ExamAttempt attempt = new ExamAttempt();
        attempt.setAssignment(assignment);
        attempt.setExamPaperId(paper.getId());
        attempt.setUserId(studentId);
        attempt.setAttemptNo(nextNo);
        attempt.setStatus(ExamAttemptStatusEnum.IN_PROGRESS);
        attempt.setStartedAt(now);
        attempt.setElapsedMs(0);
        attempt.setPassScorePercent(paper.getPassScorePercent());

        return ExamAssignmentServiceImpl.toAttemptDto(attemptRepository.save(attempt));
    }

    @Override
    @Transactional
    public ResExamAttemptDTO submit(ReqSubmitExamAttemptDTO request) throws IdInvalidException {
        UUID studentId = enrollmentAccessService
                .currentStudentId()
                .orElseThrow(() -> new IdInvalidException("Cần đăng nhập"));

        ExamAttempt attempt = attemptRepository
                .findByIdAndVoidedFalse(request.getAttemptId())
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy bài làm"));

        if (!attempt.getUserId().equals(studentId)) {
            throw new IdInvalidException("Không có quyền nộp bài này");
        }
        if (attempt.getStatus() != ExamAttemptStatusEnum.IN_PROGRESS) {
            throw new IdInvalidException("Bài làm đã được nộp trước đó");
        }

        ExamAssignment assignment = assignmentRepository
                .findByIdWithDetails(attempt.getAssignment().getId())
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy đề được giao"));

        Instant now = Instant.now();
        long elapsed = Math.max(0, request.getElapsedMs());
        if (elapsed == 0 && attempt.getStartedAt() != null) {
            elapsed = Math.max(0, Duration.between(attempt.getStartedAt(), now).toMillis());
        }

        ExamPaper paper = assignment.getExamPaper();
        boolean timedOut = false;
        if (paper != null && paper.getDurationMinutes() != null && paper.getDurationMinutes() > 0) {
            long limitMs = paper.getDurationMinutes() * 60_000L;
            if (elapsed >= limitMs) {
                timedOut = true;
                elapsed = Math.max(elapsed, limitMs);
            }
        }

        int passScore =
                paper != null ? paper.getPassScorePercent() : attempt.getPassScorePercent();

        List<String> payloads =
                examSectionRepository
                        .findByExamPaper_IdAndVoidedFalseOrderByDisplayOrderAsc(attempt.getExamPaperId())
                        .stream()
                        .map(ExamSection::getPayloadJson)
                        .collect(Collectors.toList());

        ExamAttemptScoringService.ScoreResult scored =
                scoringService.score(payloads, request.getAnswers(), passScore);

        attempt.setCorrectCount(scored.correctUnits());
        attempt.setTotalCount(scored.totalUnits());
        attempt.setScorePercent(scored.scorePercent());
        attempt.setPassed(scored.passed());
        attempt.setPassScorePercent(passScore);
        attempt.setElapsedMs(elapsed);
        attempt.setSubmittedAt(now);
        attempt.setStatus(timedOut ? ExamAttemptStatusEnum.TIMED_OUT : ExamAttemptStatusEnum.SUBMITTED);
        attempt.setAnswersJson(toJson(request.getAnswers()));

        return ExamAssignmentServiceImpl.toAttemptDto(attemptRepository.save(attempt));
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
}
