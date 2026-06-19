package com.courseenglish.api.repository;

import com.courseenglish.api.domain.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    @Query("""
            SELECT t FROM PasswordResetToken t
            WHERE t.tokenHash = :tokenHash
              AND t.usedAt IS NULL
              AND t.voided = false
              AND t.expiresAt > :now
            """)
    Optional<PasswordResetToken> findActiveByTokenHash(
            @Param("tokenHash") String tokenHash,
            @Param("now") Instant now);

    @Modifying
    @Query("""
            UPDATE PasswordResetToken t
            SET t.voided = true, t.updatedAt = :now
            WHERE t.user.id = :userId
              AND t.usedAt IS NULL
              AND t.voided = false
            """)
    void voidActiveTokensForUser(@Param("userId") UUID userId, @Param("now") Instant now);
}
