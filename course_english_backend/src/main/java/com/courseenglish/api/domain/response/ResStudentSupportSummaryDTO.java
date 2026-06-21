package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResStudentSupportSummaryDTO {
    private long criticalCount;
    private long warningCount;
    private long attentionCount;
    private long totalAtRisk;
}
