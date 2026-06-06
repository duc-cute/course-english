package com.courseenglish.api.repository;

import com.courseenglish.api.domain.QuestionChoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionChoiceRepository extends JpaRepository<QuestionChoice, UUID> {
    List<QuestionChoice> findByQuestion_IdAndVoidedFalseOrderByDisplayOrderAsc(UUID questionId);

    List<QuestionChoice> findByQuestion_Id(UUID questionId);
}
