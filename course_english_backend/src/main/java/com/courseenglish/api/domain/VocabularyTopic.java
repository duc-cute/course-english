package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.VocabularyTopicStatusEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "vocabulary_topics")
@Getter
@Setter
public class VocabularyTopic extends BaseObject {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "journey_id", nullable = false)
    private VocabularyJourney journey;

    @Column(length = 128)
    private String slug;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @Column(length = 255)
    private String subtitle;

    @Column(name = "cover_image_url", length = 512)
    private String coverImageUrl;

    @Column(name = "theme_color", length = 32)
    private String themeColor;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VocabularyTopicStatusEnum status = VocabularyTopicStatusEnum.DRAFT;
}
