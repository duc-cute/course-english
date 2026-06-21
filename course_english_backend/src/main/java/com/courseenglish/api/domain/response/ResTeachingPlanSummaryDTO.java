package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResTeachingPlanSummaryDTO {

    private int classesToday;
    private int sessionsToday;
    private Long nextSessionInMinutes;
    private String nextSessionTitle;
}
