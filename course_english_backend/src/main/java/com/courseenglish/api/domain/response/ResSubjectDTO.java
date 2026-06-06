package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResSubjectDTO {
    private UUID id;
    private String name;
    private int displayOrder;
    private UUID classroomId;
    private String classroomName;
}
