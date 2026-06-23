package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.AiMessageContentTypeEnum;
import com.courseenglish.api.util.constant.AiMessageRoleEnum;
import com.courseenglish.api.util.constant.AiMessageStatusEnum;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResAiMessageDTO {
    private UUID id;
    private UUID conversationId;
    private AiMessageRoleEnum role;
    private AiMessageContentTypeEnum contentType;
    private String content;
    private String model;
    private Integer promptTokens;
    private Integer completionTokens;
    private AiMessageStatusEnum status;
    private Instant createdAt;
}
