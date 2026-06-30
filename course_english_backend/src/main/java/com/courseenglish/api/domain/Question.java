package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.QuestionSourceEnum;
import com.courseenglish.api.util.constant.QuestionStatusEnum;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "questions")
@Getter
@Setter
public class Question extends BaseObject {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private QuestionCategory category;

    @Transient
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID categoryId;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 32)
    private QuestionTypeEnum questionType = QuestionTypeEnum.MULTIPLE_CHOICE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QuestionStatusEnum status = QuestionStatusEnum.DRAFT;

    @Column(length = 255)
    private String title;

    @NotBlank(message = "promptText is required")
    @Column(name = "prompt_text", nullable = false, columnDefinition = "TEXT")
    private String promptText;

    @Column(name = "prompt_lang", nullable = false, length = 8)
    private String promptLang = "en";

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "content_json", columnDefinition = "TEXT")
    private String contentJson;

    @Column
    private Integer difficulty;

    @Column(name = "cefr_level", length = 8)
    private String cefrLevel;

    @Column(length = 32)
    private String skill;

    @Column(length = 128)
    private String topic;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private QuestionSourceEnum source = QuestionSourceEnum.MANUAL;

    @Column(name = "is_ai_generated", nullable = false)
    private boolean aiGenerated = false;

    @Column(name = "tags_json", columnDefinition = "TEXT")
    private String tagsJson;

    @OneToMany(mappedBy = "question", fetch = FetchType.LAZY)
    private List<QuestionChoice> choices = new ArrayList<>();
}
