package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.NotebookReviewStatusEnum;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "student_notebook_entries")
@Getter
@Setter
public class StudentNotebookEntry extends BaseObject {

    @Column(name = "student_id", nullable = false)
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID studentId;

    @Column(name = "word_id", nullable = false)
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID wordId;

    @Column(name = "story_id", nullable = false)
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID storyId;

    @Column(name = "context_sentence", columnDefinition = "TEXT")
    private String contextSentence;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", nullable = false, length = 20)
    private NotebookReviewStatusEnum reviewStatus = NotebookReviewStatusEnum.NEW;
}
