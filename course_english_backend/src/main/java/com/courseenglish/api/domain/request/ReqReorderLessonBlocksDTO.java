package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ReqReorderLessonBlocksDTO {
    private List<UUID> blockIds;
}
