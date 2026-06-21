package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.SessionTypeEnum;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ReqRecurringClassSessionDTO {

    @NotNull(message = "classroomId is required")
    private UUID classroomId;

    private UUID lessonId;

    @NotBlank(message = "title is required")
    @Size(max = 255)
    private String title;

    @NotNull(message = "sessionType is required")
    private SessionTypeEnum sessionType = SessionTypeEnum.LIVE_CLASS;

    /** ISO weekday 1=Monday … 7=Sunday */
    @NotEmpty(message = "weekdays is required")
    private List<Integer> weekdays;

    @NotNull(message = "rangeStart is required")
    private LocalDate rangeStart;

    private LocalDate rangeEnd;

    @Min(value = 1, message = "weekCount must be at least 1")
    @Max(value = 52, message = "weekCount must be at most 52")
    private Integer weekCount;

    @NotNull(message = "startTime is required")
    private LocalTime startTime;

    @NotNull(message = "endTime is required")
    private LocalTime endTime;

    private String meetLink;

    @Size(max = 128)
    private String locationLabel;

    private String notes;
}
