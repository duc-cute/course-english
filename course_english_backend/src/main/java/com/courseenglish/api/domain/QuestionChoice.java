package com.courseenglish.api.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "question_choices")
@Getter
@Setter
public class QuestionChoice extends BaseObject {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @NotBlank(message = "choiceKey is required")
    @Column(name = "choice_key", nullable = false, length = 8)
    private String choiceKey;

    @NotBlank(message = "choiceText is required")
    @Column(name = "choice_text", nullable = false, columnDefinition = "TEXT")
    private String choiceText;

    @Column(name = "is_correct", nullable = false)
    private boolean correct = false;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;
}
