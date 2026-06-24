package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqMeetingLinkDTO {

    @NotBlank(message = "meetLink is required")
    private String meetLink;
}
