package com.courseenglish.api.repository;

import com.courseenglish.api.domain.LessonPracticeAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LessonPracticeAttemptRepository extends JpaRepository<LessonPracticeAttempt, UUID> {

    Optional<LessonPracticeAttempt> findFirstByUserIdAndLessonIdAndVoidedFalseOrderByCompletedAtDesc(
            UUID userId, UUID lessonId);

    Optional<LessonPracticeAttempt> findFirstByUserIdAndLessonIdAndVoidedFalseOrderByScorePercentDescCorrectCountDescCompletedAtDesc(
            UUID userId, UUID lessonId);

    List<LessonPracticeAttempt> findByUserIdAndLessonIdAndVoidedFalseOrderByCompletedAtDesc(
            UUID userId, UUID lessonId);

    long countByUserIdAndLessonIdAndVoidedFalse(UUID userId, UUID lessonId);

    List<LessonPracticeAttempt> findByUserIdAndLessonIdInAndVoidedFalse(UUID userId, List<UUID> lessonIds);

    List<LessonPracticeAttempt> findByLessonIdInAndVoidedFalse(Collection<UUID> lessonIds);
}
