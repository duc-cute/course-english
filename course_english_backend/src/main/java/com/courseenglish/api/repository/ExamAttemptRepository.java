package com.courseenglish.api.repository;

import com.courseenglish.api.domain.ExamAttempt;
import com.courseenglish.api.util.constant.ExamAttemptStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, UUID> {

    Optional<ExamAttempt> findByIdAndVoidedFalse(UUID id);

    List<ExamAttempt> findByAssignment_IdAndUserIdAndVoidedFalseOrderByAttemptNoAsc(
            UUID assignmentId, UUID userId);

    Optional<ExamAttempt> findFirstByAssignment_IdAndUserIdAndStatusAndVoidedFalseOrderByAttemptNoDesc(
            UUID assignmentId, UUID userId, ExamAttemptStatusEnum status);

    long countByAssignment_IdAndUserIdAndStatusInAndVoidedFalse(
            UUID assignmentId, UUID userId, Collection<ExamAttemptStatusEnum> statuses);

    List<ExamAttempt> findByAssignment_IdAndVoidedFalse(UUID assignmentId);

    Optional<ExamAttempt> findFirstByAssignment_IdAndUserIdAndVoidedFalseOrderByAttemptNoDesc(
            UUID assignmentId, UUID userId);
}
