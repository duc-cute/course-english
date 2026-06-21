package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ResTeachingPlanDTO {

    private LocalDate date;
    private String timezone = "Asia/Ho_Chi_Minh";
    private ResTeachingPlanSummaryDTO summary = new ResTeachingPlanSummaryDTO();
    private List<ResClassSessionDTO> sessions = new ArrayList<>();
}
