package com.courseenglish.api.repository;

import com.courseenglish.api.domain.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Optional<Notification> findByIdAndUserIdAndVoidedFalse(UUID id, UUID userId);

    long countByUserIdAndReadAtIsNullAndVoidedFalse(UUID userId);

    Page<Notification> findByUserIdAndVoidedFalseOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<Notification> findByUserIdAndReadAtIsNullAndVoidedFalseOrderByCreatedAtDesc(
            UUID userId, Pageable pageable);

    @Modifying
    @Query("""
            UPDATE Notification n
            SET n.readAt = :readAt, n.updatedAt = :readAt
            WHERE n.userId = :userId AND n.readAt IS NULL AND n.voided = false
            """)
    int markAllRead(@Param("userId") UUID userId, @Param("readAt") Instant readAt);
}
