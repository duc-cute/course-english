package com.courseenglish.api.repository;

import com.courseenglish.api.domain.Story;
import com.courseenglish.api.util.constant.StoryStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface StoryRepository extends JpaRepository<Story, UUID>, JpaSpecificationExecutor<Story> {

    Optional<Story> findByIdAndVoidedFalse(UUID id);

    Optional<Story> findBySlugAndVoidedFalse(String slug);

    boolean existsBySlugAndVoidedFalseAndIdNot(String slug, UUID id);

    boolean existsBySlugAndVoidedFalse(String slug);
}
