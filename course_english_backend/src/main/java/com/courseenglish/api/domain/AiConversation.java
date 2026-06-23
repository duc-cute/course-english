package com.courseenglish.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "ai_conversations",
        indexes = {
                @Index(name = "idx_ai_conv_user_last_message", columnList = "user_id,last_message_at")
        }
)
@Getter
@Setter
public class AiConversation extends BaseObject {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "user_id", nullable = false, length = 36)
    private UUID userId;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;
}
