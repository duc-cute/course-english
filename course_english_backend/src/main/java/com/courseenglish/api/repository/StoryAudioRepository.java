package com.courseenglish.api.repository;

import com.courseenglish.api.domain.StoryAudio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StoryAudioRepository extends JpaRepository<StoryAudio, UUID> {

    Optional<StoryAudio> findFirstByStoryIdAndContentHashAndVoidedFalseOrderByCreatedAtDesc(
            UUID storyId, String contentHash);

    Optional<StoryAudio> findFirstByStoryIdAndVoidedFalseOrderByCreatedAtDesc(UUID storyId);

    List<StoryAudio> findByStoryIdAndVoidedFalse(UUID storyId);
}
