package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqEnrollmentDTO {
    @NotNull(message = "classroomId is required")
    private UUID classroomId;

    @NotNull(message = "studentId is required")
    private UUID studentId;

    private String status;
}
