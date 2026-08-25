package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqSubmitExamAttemptDTO {

    @NotNull(message = "attemptId is required")
    private UUID attemptId;

    /** Optional — server scores from answers against original paper. */
    @Min(0)
    private Integer correctCount;

    @Min(0)
    private Integer totalCount;

    @Min(0)
    private Integer scorePercent;

    private Boolean passed;

    @Min(0)
    private long elapsedMs;

    /** Structured snapshot: { answers, questionIdsOrder?, choiceOrders? } or flat answers map. */
    private Object answers;
}
