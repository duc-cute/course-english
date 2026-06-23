package com.courseenglish.api.repository;

import com.courseenglish.api.domain.AiConversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface AiConversationRepository extends JpaRepository<AiConversation, UUID> {
    Page<AiConversation> findByUserIdAndVoidedFalseOrderByLastMessageAtDescCreatedAtDesc(UUID userId, Pageable pageable);

    Optional<AiConversation> findByIdAndUserIdAndVoidedFalse(UUID id, UUID userId);

    long countByVoidedFalse();

    @Query("select count(distinct c.userId) from AiConversation c where c.voided = false")
    long countDistinctUsers();
}
