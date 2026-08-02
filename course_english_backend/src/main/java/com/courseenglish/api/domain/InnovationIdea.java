package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.InnovationIdeaCategoryEnum;
import com.courseenglish.api.util.constant.InnovationIdeaPriorityEnum;
import com.courseenglish.api.util.constant.InnovationIdeaStatusEnum;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
        name = "innovation_ideas",
        indexes = {
                @Index(name = "idx_innovation_idea_created_by", columnList = "created_by_user_id"),
                @Index(name = "idx_innovation_idea_status", columnList = "status"),
                @Index(name = "idx_innovation_idea_category", columnList = "category")
        }
)
@Getter
@Setter
public class InnovationIdea extends BaseObject {

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private InnovationIdeaCategoryEnum category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private InnovationIdeaStatusEnum status = InnovationIdeaStatusEnum.UNDER_REVIEW;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InnovationIdeaPriorityEnum priority = InnovationIdeaPriorityEnum.MEDIUM;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "created_by_user_id", nullable = false, length = 36)
    private UUID createdByUserId;

    @Column(name = "vote_count", nullable = false)
    private int voteCount = 0;

    @Column(name = "comment_count", nullable = false)
    private int commentCount = 0;

    /** Public storage paths under /storage/inovation/… */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "image_urls")
    private List<String> imageUrls = new ArrayList<>();
}
