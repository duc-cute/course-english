package com.courseenglish.api.repository;

import com.courseenglish.api.domain.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID>, JpaSpecificationExecutor<Question> {
    Optional<Question> findByIdAndVoidedFalse(UUID id);

    List<Question> findByIdInAndVoidedFalse(List<UUID> ids);

    long countByVoidedFalse();

    long countByVoidedFalseAndAiGeneratedTrue();

    @Query("SELECT q.status, COUNT(q) FROM Question q WHERE q.voided = false GROUP BY q.status")
    List<Object[]> countGroupByStatus();

    @Query("SELECT q.questionType, COUNT(q) FROM Question q WHERE q.voided = false GROUP BY q.questionType")
    List<Object[]> countGroupByQuestionType();
}
