package com.courseenglish.api.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "question_categories")
@Getter
@Setter
public class QuestionCategory extends BaseObject {

    @NotBlank(message = "name is required")
    @Column(nullable = false, length = 128)
    private String name;

    @NotBlank(message = "slug is required")
    @Column(nullable = false, length = 64, unique = true)
    private String slug;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private QuestionCategory parent;

    @Transient
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID parentId;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;
}
