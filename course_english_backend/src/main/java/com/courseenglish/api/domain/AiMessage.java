package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.AiMessageContentTypeEnum;
import com.courseenglish.api.util.constant.AiMessageRoleEnum;
import com.courseenglish.api.util.constant.AiMessageStatusEnum;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
        name = "ai_messages",
        indexes = {
                @Index(name = "idx_ai_msg_conv_created", columnList = "conversation_id,created_at")
        }
)
@Getter
@Setter
public class AiMessage extends BaseObject {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private AiConversation conversation;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 16)
    private AiMessageRoleEnum role = AiMessageRoleEnum.USER;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 20)
    private AiMessageContentTypeEnum contentType = AiMessageContentTypeEnum.TEXT;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "model", length = 80)
    private String model;

    @Column(name = "prompt_tokens")
    private Integer promptTokens;

    @Column(name = "completion_tokens")
    private Integer completionTokens;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private AiMessageStatusEnum status = AiMessageStatusEnum.COMPLETED;
}
