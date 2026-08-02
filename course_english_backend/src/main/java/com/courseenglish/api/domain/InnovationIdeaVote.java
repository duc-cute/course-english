package com.courseenglish.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(
        name = "innovation_idea_votes",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_innovation_vote_idea_user",
                columnNames = {"idea_id", "user_id"}
        ),
        indexes = {
                @Index(name = "idx_innovation_vote_idea", columnList = "idea_id"),
                @Index(name = "idx_innovation_vote_user", columnList = "user_id")
        }
)
@Getter
@Setter
public class InnovationIdeaVote extends BaseObject {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "idea_id", nullable = false, length = 36)
    private UUID ideaId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "user_id", nullable = false, length = 36)
    private UUID userId;
}
