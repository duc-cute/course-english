package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResInnovationCommentDTO {
    private UUID id;
    private UUID ideaId;
    private UUID userId;
    private String displayName;
    private String body;
    private Instant createdAt;
}
