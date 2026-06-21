package com.courseenglish.api.repository;

import com.courseenglish.api.domain.Lesson;
import com.courseenglish.api.util.constant.LessonStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, UUID>, JpaSpecificationExecutor<Lesson> {
    Optional<Lesson> findByIdAndVoidedFalse(UUID id);

    Optional<Lesson> findBySlugAndVoidedFalse(String slug);

    boolean existsBySlugAndVoidedFalse(String slug);

    boolean existsBySlugAndVoidedFalseAndIdNot(String slug, UUID id);

    List<Lesson> findBySubject_IdInAndStatusAndVoidedFalse(Collection<UUID> subjectIds, LessonStatusEnum status);
}
