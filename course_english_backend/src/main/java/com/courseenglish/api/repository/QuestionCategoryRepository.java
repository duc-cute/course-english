package com.courseenglish.api.repository;

import com.courseenglish.api.domain.QuestionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuestionCategoryRepository extends JpaRepository<QuestionCategory, UUID> {
    List<QuestionCategory> findByVoidedFalseOrderByDisplayOrderAsc();

    Optional<QuestionCategory> findByIdAndVoidedFalse(UUID id);

    Optional<QuestionCategory> findBySlugAndVoidedFalse(String slug);
}
