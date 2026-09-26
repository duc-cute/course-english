package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.StorySceneStatusEnum;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "story_scenes")
@Getter
@Setter
public class StoryScene extends BaseObject {

    @Column(name = "story_id", nullable = false)
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID storyId;

    @Column(name = "scene_index", nullable = false)
    private int sceneIndex;

    @Column(name = "sentence_start", nullable = false)
    private int sentenceStart;

    @Column(name = "sentence_end", nullable = false)
    private int sentenceEnd;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String location;

    @Column(name = "characters_json", columnDefinition = "TEXT")
    private String charactersJson;

    @Column(name = "segments_json", columnDefinition = "MEDIUMTEXT")
    private String segmentsJson;

    @Column(name = "image_prompt", columnDefinition = "TEXT")
    private String imagePrompt;

    @Column(name = "image_url", length = 1024)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StorySceneStatusEnum status = StorySceneStatusEnum.PENDING;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
