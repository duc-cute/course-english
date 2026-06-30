package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.ExamPaperStatusEnum;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResExamPaperDTO {
    private Integer bankQuestionsSynced;

    private UUID id;
    private String title;
    private String instruction;
    private Integer durationMinutes;
    private Integer passScorePercent;
    private ExamPaperStatusEnum status;
    private UUID subjectId;
    private String subjectName;
    private int sectionCount;
    private int questionCount;
    private List<ResExamSectionDTO> sections;
    private Instant createdAt;
    private Instant updatedAt;
}
