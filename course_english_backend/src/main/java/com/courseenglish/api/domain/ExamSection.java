package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.QuestionTypeEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "exam_sections")
@Getter
@Setter
public class ExamSection extends BaseObject {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_paper_id", nullable = false)
    private ExamPaper examPaper;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String instruction;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", length = 32)
    private QuestionTypeEnum questionType;

    @Column(name = "payload_json", nullable = false, columnDefinition = "TEXT")
    private String payloadJson;
}
