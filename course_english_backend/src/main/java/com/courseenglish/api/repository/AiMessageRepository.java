package com.courseenglish.api.repository;

import com.courseenglish.api.domain.AiMessage;
import com.courseenglish.api.util.constant.AiMessageRoleEnum;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AiMessageRepository extends JpaRepository<AiMessage, UUID> {

    List<AiMessage> findByConversation_IdAndVoidedFalseOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

    @Query("""
            select m from AiMessage m
            where m.conversation.id = :conversationId
              and m.voided = false
              and m.createdAt < :beforeCreatedAt
            order by m.createdAt desc
            """)
    List<AiMessage> findBeforeCreatedAt(
            @Param("conversationId") UUID conversationId,
            @Param("beforeCreatedAt") Instant beforeCreatedAt,
            Pageable pageable);

    Optional<AiMessage> findByIdAndConversation_IdAndVoidedFalse(UUID id, UUID conversationId);

    @Query("""
            select count(m.id) from AiMessage m
            where m.conversation.userId = :userId
              and m.role = :role
              and m.voided = false
              and m.createdAt >= :start
              and m.createdAt < :end
            """)
    long countByUserRoleInRange(
            @Param("userId") UUID userId,
            @Param("role") AiMessageRoleEnum role,
            @Param("start") Instant start,
            @Param("end") Instant end);

    @Query("""
            select coalesce(sum(m.promptTokens), 0), coalesce(sum(m.completionTokens), 0)
            from AiMessage m
            where m.role = com.courseenglish.api.util.constant.AiMessageRoleEnum.ASSISTANT
              and m.voided = false
            """)
    Object[] sumAssistantTokensAllTime();

    @Query("""
            select coalesce(sum(m.promptTokens), 0), coalesce(sum(m.completionTokens), 0)
            from AiMessage m
            where m.role = com.courseenglish.api.util.constant.AiMessageRoleEnum.ASSISTANT
              and m.voided = false
              and m.createdAt >= :start
              and m.createdAt < :end
            """)
    Object[] sumAssistantTokensInRange(@Param("start") Instant start, @Param("end") Instant end);

    @Query("""
            select count(m.id) from AiMessage m
            where m.role = com.courseenglish.api.util.constant.AiMessageRoleEnum.USER
              and m.voided = false
            """)
    long countUserMessagesAllTime();

    @Query("""
            select count(m.id) from AiMessage m
            where m.role = com.courseenglish.api.util.constant.AiMessageRoleEnum.USER
              and m.voided = false
              and m.createdAt >= :start
              and m.createdAt < :end
            """)
    long countUserMessagesInRange(@Param("start") Instant start, @Param("end") Instant end);

    @Query(
            value = """
                    select cast(m.created_at as date) as usage_date,
                           coalesce(sum(case when m.role = 'ASSISTANT' then m.prompt_tokens else 0 end), 0) as prompt_tokens,
                           coalesce(sum(case when m.role = 'ASSISTANT' then m.completion_tokens else 0 end), 0) as completion_tokens,
                           coalesce(sum(case when m.role = 'USER' then 1 else 0 end), 0) as request_count
                    from ai_messages m
                    where m.voided = 0
                      and m.created_at >= :since
                    group by cast(m.created_at as date)
                    order by usage_date
                    """,
            nativeQuery = true)
    List<Object[]> dailyUsageSince(@Param("since") Instant since);
}
