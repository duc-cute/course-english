package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.ExamAssignmentStatusEnum;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResExamAssignmentDTO {
    private UUID id;
    private UUID examPaperId;
    private String examPaperTitle;
    private Integer durationMinutes;
    private Integer passScorePercent;
    private Integer sectionCount;
    private Integer questionCount;
    private UUID classroomId;
    private String classroomName;
    private UUID assignedById;
    private String teacherName;
    private Instant assignedAt;
    private Instant openAt;
    private Instant dueAt;
    private Instant closeAt;
    private int maxAttempts;
    private String note;
    private ExamAssignmentStatusEnum status;
}
