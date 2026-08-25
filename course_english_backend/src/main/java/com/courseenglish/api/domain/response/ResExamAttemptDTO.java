package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.ExamAttemptStatusEnum;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResExamAttemptDTO {
    private UUID id;
    private UUID assignmentId;
    private UUID examPaperId;
    private UUID userId;
    private int attemptNo;
    private ExamAttemptStatusEnum status;
    private Instant startedAt;
    private Instant submittedAt;
    private long elapsedMs;
    private Integer correctCount;
    private Integer totalCount;
    private Integer scorePercent;
    private Boolean passed;
    private int passScorePercent;
}
