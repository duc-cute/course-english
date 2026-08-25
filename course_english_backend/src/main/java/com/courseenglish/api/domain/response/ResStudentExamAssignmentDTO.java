package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ResStudentExamAssignmentDTO extends ResExamAssignmentDTO {
    /** Cửa sổ làm bài đang mở theo open/close. */
    private boolean windowOpen;
    private int attemptsUsed;
    private int attemptsRemaining;
    private boolean canStart;
    private ResExamAttemptDTO inProgressAttempt;
    private ResExamAttemptDTO latestSubmittedAttempt;
    /** Sections with answers redacted (for taking exam). */
    private List<ResExamSectionDTO> sections;
}
