package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.LessonBlockTypeEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "lesson_blocks")
@Getter
@Setter
public class LessonBlock extends BaseObject {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Transient
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID lessonId;

    @Enumerated(EnumType.STRING)
    @Column(name = "block_type", nullable = false, length = 30)
    private LessonBlockTypeEnum blockType;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @Column(name = "payload_json", columnDefinition = "TEXT")
    private String payloadJson;
}
