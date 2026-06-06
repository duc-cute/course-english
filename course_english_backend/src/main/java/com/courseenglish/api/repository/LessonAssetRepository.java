package com.courseenglish.api.repository;

import com.courseenglish.api.domain.LessonAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LessonAssetRepository extends JpaRepository<LessonAsset, UUID> {
    Optional<LessonAsset> findByIdAndVoidedFalse(UUID id);

    List<LessonAsset> findByLesson_IdAndVoidedFalseOrderByDisplayOrderAsc(UUID lessonId);
}
