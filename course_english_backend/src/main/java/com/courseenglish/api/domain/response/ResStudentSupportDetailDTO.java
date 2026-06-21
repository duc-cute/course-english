package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ResStudentSupportDetailDTO {
    private ResStudentSupportItemDTO profile;
    private List<ResStudentSupportLessonProgressDTO> overdueLessons = new ArrayList<>();
    private List<ResStudentSupportLessonProgressDTO> upcomingLessons = new ArrayList<>();
    private List<ResStudentSupportLessonProgressDTO> completedLessons = new ArrayList<>();
}
