package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ReqCreateExamAssignmentDTO {

    @NotNull(message = "examPaperId is required")
    private UUID examPaperId;

    @NotNull(message = "classroomId is required")
    private UUID classroomId;

    private Instant openAt;

    private Instant dueAt;

    private Instant closeAt;

    @Min(1)
    @Max(10)
    private Integer maxAttempts;

    private String note;
}
