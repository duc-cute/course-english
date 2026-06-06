package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.LessonAssetTypeEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "lesson_assets")
@Getter
@Setter
public class LessonAsset extends BaseObject {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Transient
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID lessonId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LessonAssetTypeEnum type;

    @Column(nullable = false, length = 1024)
    private String url;

    @Column(length = 500)
    private String caption;

    @Column(name = "meta_json", columnDefinition = "TEXT")
    private String metaJson;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;
}
