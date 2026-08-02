package com.courseenglish.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(
        name = "innovation_idea_comments",
        indexes = {
                @Index(name = "idx_innovation_comment_idea", columnList = "idea_id"),
                @Index(name = "idx_innovation_comment_user", columnList = "user_id")
        }
)
@Getter
@Setter
public class InnovationIdeaComment extends BaseObject {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "idea_id", nullable = false, length = 36)
    private UUID ideaId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "user_id", nullable = false, length = 36)
    private UUID userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;
}
