package com.courseenglish.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vocabulary_words")
@Getter
@Setter
public class VocabularyWord extends BaseObject {

    @NotBlank(message = "wordKey is required")
    @Column(name = "word_key", nullable = false, unique = true)
    private String wordKey;

    @NotBlank(message = "wordEn is required")
    @Column(name = "word_en", nullable = false)
    private String wordEn;

    @NotBlank(message = "meaningVi is required")
    @Column(name = "meaning_vi", nullable = false, columnDefinition = "TEXT")
    private String meaningVi;

    @Column(length = 128)
    private String phonetic;

    @Column(name = "audio_uk_url", length = 512)
    private String audioUkUrl;

    @Column(name = "audio_us_url", length = 512)
    private String audioUsUrl;

    @Column(name = "part_of_speech", length = 64)
    private String partOfSpeech;

    @Column(name = "example_sentence", columnDefinition = "TEXT")
    private String exampleSentence;

    @Column(name = "image_asset_id")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID imageAssetId;

    @Column(name = "audio_asset_id")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID audioAssetId;

    @Column(name = "enriched_at")
    private Instant enrichedAt;

    @Column(name = "enrich_source", length = 64)
    private String enrichSource;
}
