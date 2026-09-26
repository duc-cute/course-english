package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.StoryFormatEnum;
import com.courseenglish.api.util.constant.StoryIllustrationStatusEnum;
import com.courseenglish.api.util.constant.StoryVisualStyleEnum;
import com.courseenglish.api.util.constant.StoryProcessingStatusEnum;
import com.courseenglish.api.util.constant.StoryStatusEnum;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "stories")
@Getter
@Setter
public class Story extends BaseObject {

    @NotBlank
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String slug;

    @NotBlank
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 16)
    private String level;

    @Column(name = "reading_time_minutes")
    private Integer readingTimeMinutes;

    @Column(columnDefinition = "TEXT")
    private String prompt;

    @Column(name = "cover_image_url", length = 1024)
    private String coverImageUrl;

    @Column(name = "vocabulary_set_id")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID vocabularySetId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StoryStatusEnum status = StoryStatusEnum.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status", nullable = false, length = 32)
    private StoryProcessingStatusEnum processingStatus = StoryProcessingStatusEnum.PENDING;

    @Column(name = "tokens_json", columnDefinition = "TEXT")
    private String tokensJson;

    @Column(name = "translations_json", columnDefinition = "TEXT")
    private String translationsJson;

    @Column(name = "voice_profile_json", columnDefinition = "TEXT")
    private String voiceProfileJson;

    @Column(name = "visual_profile_json", columnDefinition = "TEXT")
    private String visualProfileJson;

    @Column(name = "characters_json", columnDefinition = "TEXT")
    private String charactersJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "illustration_status", nullable = false, length = 32)
    private StoryIllustrationStatusEnum illustrationStatus = StoryIllustrationStatusEnum.NONE;

    @Column(name = "illustration_last_error", columnDefinition = "TEXT")
    private String illustrationLastError;

    @Enumerated(EnumType.STRING)
    @Column(name = "story_format", nullable = false, length = 20)
    private StoryFormatEnum storyFormat = StoryFormatEnum.STORYBOOK;

    @Enumerated(EnumType.STRING)
    @Column(name = "visual_style", nullable = false, length = 32)
    private StoryVisualStyleEnum visualStyle = StoryVisualStyleEnum.PASTEL_STORYBOOK;

    @Column(name = "audio_last_error", columnDefinition = "TEXT")
    private String audioLastError;

    @Column(name = "is_ai_generated", nullable = false)
    private boolean aiGenerated;
}
