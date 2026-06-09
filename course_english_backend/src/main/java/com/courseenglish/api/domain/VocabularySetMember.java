package com.courseenglish.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
        name = "vocabulary_set_members",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_vsm_set_word",
                columnNames = {"set_id", "word_id"}
        )
)
@Getter
@Setter
public class VocabularySetMember extends BaseObject {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "set_id", nullable = false)
    private VocabularySet vocabularySet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private VocabularyWord vocabularyWord;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;
}
