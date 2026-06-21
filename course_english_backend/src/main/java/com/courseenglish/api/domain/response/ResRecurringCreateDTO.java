package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResRecurringCreateDTO {

    private UUID recurrenceGroupId;
    private String recurrenceRule;
    private int createdCount;
    private List<ResClassSessionDTO> sessions = new ArrayList<>();
}
