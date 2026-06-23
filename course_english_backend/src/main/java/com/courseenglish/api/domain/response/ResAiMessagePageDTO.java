package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResAiMessagePageDTO {
    private List<ResAiMessageDTO> items;
    private boolean hasMore;
    private UUID nextBefore;
}
