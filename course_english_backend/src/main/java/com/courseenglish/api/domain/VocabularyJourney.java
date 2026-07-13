package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.VocabularyJourneyStatusEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "vocabulary_journeys")
@Getter
@Setter
public class VocabularyJourney extends BaseObject {

    @NotBlank
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_image_url", length = 512)
    private String coverImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VocabularyJourneyStatusEnum status = VocabularyJourneyStatusEnum.DRAFT;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;
}
