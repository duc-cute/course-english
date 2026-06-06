package com.courseenglish.api.repository;

import com.courseenglish.api.domain.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID>, JpaSpecificationExecutor<Question> {
    Optional<Question> findByIdAndVoidedFalse(UUID id);

    List<Question> findByIdInAndVoidedFalse(List<UUID> ids);
}
