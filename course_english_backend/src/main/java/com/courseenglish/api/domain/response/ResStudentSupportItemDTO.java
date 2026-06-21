package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.StudentSupportRiskLevelEnum;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResStudentSupportItemDTO {
    private UUID studentId;
    private String studentName;
    private String avatarUrl;
    private UUID classroomId;
    private String classroomName;
    private StudentSupportRiskLevelEnum riskLevel;
    private int riskScore;
    private int inactiveDays;
    private int missingAssignments;
    private List<ResStudentSupportOverdueLessonDTO> overdueLessons = new ArrayList<>();
    private Integer avgScorePercent;
    private Integer scoreTrendPercent;
    private String primaryReason;
    private List<String> reasonCodes = new ArrayList<>();
}
