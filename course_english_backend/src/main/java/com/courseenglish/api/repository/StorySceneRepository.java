package com.courseenglish.api.repository;

import com.courseenglish.api.domain.StoryScene;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StorySceneRepository extends JpaRepository<StoryScene, UUID> {

    List<StoryScene> findByStoryIdAndVoidedFalseOrderBySceneIndexAsc(UUID storyId);

    Optional<StoryScene> findByStoryIdAndSceneIndexAndVoidedFalse(UUID storyId, int sceneIndex);

    void deleteByStoryId(UUID storyId);
}
