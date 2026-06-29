package com.courseenglish.api.repository;

import com.courseenglish.api.domain.AiTask;
import com.courseenglish.api.util.constant.AiTaskStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface AiTaskRepository extends JpaRepository<AiTask, UUID> {

  Optional<AiTask> findByIdAndUserIdAndVoidedFalse(UUID id, UUID userId);

  Page<AiTask> findByUserIdAndTaskTypeAndVoidedFalseOrderByCreatedAtDesc(
      UUID userId, com.courseenglish.api.util.constant.AiTaskTypeEnum taskType, Pageable pageable);

  long countByUserIdAndVoidedFalseAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
      UUID userId, Instant startInclusive, Instant endExclusive);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      """
      UPDATE AiTask t
      SET t.status = :processing,
          t.startedAt = :startedAt,
          t.progressMessage = 'Đang chuẩn bị sinh câu…',
          t.progressPercent = 0
      WHERE t.id = :id
        AND t.status = :pending
        AND t.voided = false
      """)
  int claimIfPending(
      @Param("id") UUID id,
      @Param("startedAt") Instant startedAt,
      @Param("pending") AiTaskStatusEnum pending,
      @Param("processing") AiTaskStatusEnum processing);
}
