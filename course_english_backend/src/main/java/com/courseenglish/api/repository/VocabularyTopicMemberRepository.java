package com.courseenglish.api.repository;

import com.courseenglish.api.domain.VocabularyTopicMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VocabularyTopicMemberRepository extends JpaRepository<VocabularyTopicMember, UUID> {

    List<VocabularyTopicMember> findByTopic_IdAndVoidedFalseOrderByDisplayOrderAsc(UUID topicId);

    Optional<VocabularyTopicMember> findByTopic_IdAndVocabularySet_Id(UUID topicId, UUID vocabularySetId);

    @Query("""
            SELECT m FROM VocabularyTopicMember m
            JOIN FETCH m.vocabularySet s
            LEFT JOIN FETCH s.subject
            WHERE m.voided = false
              AND m.topic.id = :topicId
            ORDER BY m.displayOrder ASC
            """)
    List<VocabularyTopicMember> findActiveWithSetByTopicId(@Param("topicId") UUID topicId);

    long countByTopic_IdAndVoidedFalse(UUID topicId);
}
