package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResAiConversationDTO {
    private UUID id;
    private String title;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastMessageAt;
}
