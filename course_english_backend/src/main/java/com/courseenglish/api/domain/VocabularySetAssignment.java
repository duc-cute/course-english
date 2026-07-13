package com.courseenglish.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vocabulary_set_assignments")
@Getter
@Setter
public class VocabularySetAssignment extends BaseObject {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vocabulary_set_id", nullable = false)
    private VocabularySet vocabularySet;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private User assignedBy;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(length = 512)
    private String note;

    /** ACTIVE | CANCELLED */
    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Transient
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID vocabularySetId;

    @Transient
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID classroomId;
}
