package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.LessonStatusEnum;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "lessons")
@Getter
@Setter
public class Lesson extends BaseObject {

    @NotBlank(message = "title is required")
    @Column(nullable = false)
    private String title;

    /** Slug do server sinh khi tạo — không nhận từ client. */
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Column(nullable = false, length = 64, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "cover_image_url", columnDefinition = "TEXT")
    private String coverImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LessonStatusEnum status = LessonStatusEnum.DRAFT;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    /** Hạn nộp bài — nullable = không theo dõi missing. */
    @Column(name = "due_at")
    private Instant dueAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Transient
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID subjectId;
}
