package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.ExamAttemptStatusEnum;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResExamClassScoreDTO {
    private UUID studentId;
    private String studentName;
    private String studentEmail;
    private String attemptStatus;
    private Integer attemptNo;
    private Integer scorePercent;
    private Boolean passed;
    private Instant submittedAt;
    private ExamAttemptStatusEnum latestStatus;
}
