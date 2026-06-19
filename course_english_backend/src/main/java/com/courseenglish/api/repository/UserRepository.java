package com.courseenglish.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.courseenglish.api.domain.User;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    User findByEmailAndVoidedFalse(String userName);

    User findByGoogleIdAndVoidedFalse(String googleId);

    boolean existsByEmailAndVoidedFalse(String email);

    User findByRefreshTokenAndEmailAndVoidedFalse(String token, String email);

    java.util.Optional<User> findByIdAndVoidedFalse(UUID id);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt BETWEEN :fromDate AND :toDate AND u.voided = false")
    long countByCreatedDate(@Param("fromDate") Instant fromDate, @Param("toDate") Instant toDate);
}
