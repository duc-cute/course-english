package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.ExamPaperStatusEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "exam_papers")
@Getter
@Setter
public class ExamPaper extends BaseObject {

    @NotBlank(message = "title is required")
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String instruction;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "pass_score_percent", nullable = false)
    private int passScorePercent = 80;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExamPaperStatusEnum status = ExamPaperStatusEnum.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Transient
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID subjectId;

    @OneToMany(mappedBy = "examPaper", fetch = FetchType.LAZY)
    private List<ExamSection> sections = new ArrayList<>();
}
