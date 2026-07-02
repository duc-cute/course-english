package com.courseenglish.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "story_audio")
@Getter
@Setter
public class StoryAudio extends BaseObject {

    @Column(name = "story_id", nullable = false)
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID storyId;

    @Column(nullable = false, length = 64)
    private String voice;

    @Column(name = "tts_provider", nullable = false, length = 32)
    private String ttsProvider;

    @Column(name = "alignment_provider", length = 32)
    private String alignmentProvider;

    @Column(name = "audio_url", nullable = false, length = 1024)
    private String audioUrl;

    @Column(precision = 10, scale = 3)
    private BigDecimal duration;

    @Column(name = "word_timeline_json", columnDefinition = "MEDIUMTEXT")
    private String wordTimelineJson;

    @Column(name = "sentence_timeline_json", columnDefinition = "MEDIUMTEXT")
    private String sentenceTimelineJson;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;
}
