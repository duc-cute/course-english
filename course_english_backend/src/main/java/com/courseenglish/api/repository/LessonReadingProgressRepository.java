package com.courseenglish.api.repository;

import com.courseenglish.api.domain.LessonReadingProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LessonReadingProgressRepository extends JpaRepository<LessonReadingProgress, UUID> {

    Optional<LessonReadingProgress> findByUserIdAndLessonIdAndVoidedFalse(UUID userId, UUID lessonId);

    Optional<LessonReadingProgress> findFirstByUserIdAndVoidedFalseOrderByUpdatedAtDesc(UUID userId);
}
