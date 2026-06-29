package com.courseenglish.api.repository;

import com.courseenglish.api.domain.ExamSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamSectionRepository extends JpaRepository<ExamSection, UUID> {
    List<ExamSection> findByExamPaper_IdAndVoidedFalseOrderByDisplayOrderAsc(UUID examPaperId);

    Optional<ExamSection> findByIdAndVoidedFalse(UUID id);

    List<ExamSection> findByExamPaper_IdAndVoidedFalse(UUID examPaperId);
}
