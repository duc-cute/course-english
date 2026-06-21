package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.SessionTypeEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ReqClassSessionDTO {

    @NotNull(message = "classroomId is required")
    private UUID classroomId;

    private UUID lessonId;

    @NotBlank(message = "title is required")
    @Size(max = 255)
    private String title;

    @NotNull(message = "sessionType is required")
    private SessionTypeEnum sessionType = SessionTypeEnum.LIVE_CLASS;

    @NotNull(message = "startAt is required")
    private Instant startAt;

    @NotNull(message = "endAt is required")
    private Instant endAt;

    private String meetLink;

    @Size(max = 128)
    private String locationLabel;

    private String notes;
}
