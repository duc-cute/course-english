package com.courseenglish.api.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "vocabulary_items")
@Getter
@Setter
public class VocabularyItem extends BaseObject {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "set_id", nullable = false)
    private VocabularySet vocabularySet;

    @NotBlank(message = "wordEn is required")
    @Column(name = "word_en", nullable = false)
    private String wordEn;

    @NotBlank(message = "meaningVi is required")
    @Column(name = "meaning_vi", nullable = false, columnDefinition = "TEXT")
    private String meaningVi;

    @Column(length = 128)
    private String phonetic;

    @Column(name = "image_asset_id")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID imageAssetId;

    @Column(name = "audio_asset_id")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID audioAssetId;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;
}
