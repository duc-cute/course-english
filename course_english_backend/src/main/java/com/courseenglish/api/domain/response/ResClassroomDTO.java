package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResClassroomDTO {
    private UUID id;
    private String name;
    private String code;
    private String description;
    private UUID teacherId;
    private String teacherName;
}
