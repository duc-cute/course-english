package com.courseenglish.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "lesson_reading_progress")
@Getter
@Setter
public class LessonReadingProgress extends BaseObject {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "user_id", nullable = false, length = 36)
    private UUID userId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "lesson_id", nullable = false, length = 36)
    private UUID lessonId;

    @Column(name = "last_block_id", length = 36)
    private String lastBlockId;

    @Column(name = "scroll_percent", nullable = false)
    private int scrollPercent;

    @Column(name = "last_tab", nullable = false, length = 16)
    private String lastTab = "study";

    @Column(name = "lesson_title")
    private String lessonTitle;

    @Column(name = "subject_name")
    private String subjectName;
}
