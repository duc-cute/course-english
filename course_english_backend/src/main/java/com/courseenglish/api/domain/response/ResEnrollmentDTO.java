package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResEnrollmentDTO {
    private UUID id;
    private UUID classroomId;
    private String classroomName;
    private UUID studentId;
    private String studentName;
    private String studentEmail;
    private String status;
    private Instant joinedAt;
}
