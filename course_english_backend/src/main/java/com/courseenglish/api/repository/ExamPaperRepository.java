package com.courseenglish.api.repository;

import com.courseenglish.api.domain.ExamPaper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamPaperRepository extends JpaRepository<ExamPaper, UUID>, JpaSpecificationExecutor<ExamPaper> {
    Optional<ExamPaper> findByIdAndVoidedFalse(UUID id);
}
