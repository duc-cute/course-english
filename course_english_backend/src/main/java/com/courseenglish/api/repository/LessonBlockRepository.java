package com.courseenglish.api.repository;

import com.courseenglish.api.domain.LessonBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LessonBlockRepository extends JpaRepository<LessonBlock, UUID> {
    Optional<LessonBlock> findByIdAndVoidedFalse(UUID id);

    List<LessonBlock> findByLesson_IdAndVoidedFalseOrderByDisplayOrderAsc(UUID lessonId);

    long countByLesson_IdAndVoidedFalse(UUID lessonId);
}
