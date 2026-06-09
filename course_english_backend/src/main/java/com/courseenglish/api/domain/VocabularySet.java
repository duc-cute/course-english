package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.VocabularySetStatusEnum;
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
@Table(name = "vocabulary_sets")
@Getter
@Setter
public class VocabularySet extends BaseObject {

    @NotBlank(message = "title is required")
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Transient
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID subjectId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VocabularySetStatusEnum status = VocabularySetStatusEnum.DRAFT;

    @OneToMany(mappedBy = "vocabularySet", fetch = FetchType.LAZY)
    private List<VocabularySetMember> members = new ArrayList<>();
}
