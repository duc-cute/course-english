package com.courseenglish.api.repository;

import com.courseenglish.api.domain.AiTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface AiTaskRepository extends JpaRepository<AiTask, UUID> {

  Optional<AiTask> findByIdAndUserIdAndVoidedFalse(UUID id, UUID userId);

  long countByUserIdAndVoidedFalseAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
      UUID userId, Instant startInclusive, Instant endExclusive);
}
