package com.courseenglish.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "vocabulary_topic_members")
@Getter
@Setter
public class VocabularyTopicMember extends BaseObject {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id", nullable = false)
    private VocabularyTopic topic;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vocabulary_set_id", nullable = false)
    private VocabularySet vocabularySet;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;
}
