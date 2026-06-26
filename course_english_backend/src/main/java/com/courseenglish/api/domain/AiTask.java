package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.AiTaskStatusEnum;
import com.courseenglish.api.util.constant.AiTaskTypeEnum;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
        name = "ai_tasks",
        indexes = {
                @Index(name = "idx_ai_task_user", columnList = "user_id,created_at"),
                @Index(name = "idx_ai_task_status", columnList = "status"),
                @Index(name = "idx_ai_task_document", columnList = "document_id")
        }
)
@Getter
@Setter
public class AiTask extends BaseObject {

  @JdbcTypeCode(SqlTypes.CHAR)
  @Column(name = "user_id", nullable = false, length = 36)
  private UUID userId;

  @JdbcTypeCode(SqlTypes.CHAR)
  @Column(name = "conversation_id", length = 36)
  private UUID conversationId;

  @JdbcTypeCode(SqlTypes.CHAR)
  @Column(name = "document_id", length = 36)
  private UUID documentId;

  @Enumerated(EnumType.STRING)
  @Column(name = "task_type", nullable = false, length = 32)
  private AiTaskTypeEnum taskType;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 20)
  private AiTaskStatusEnum status = AiTaskStatusEnum.PENDING;

  @Column(name = "input_json", columnDefinition = "TEXT")
  private String inputJson;

  @Column(name = "output_json", columnDefinition = "LONGTEXT")
  private String outputJson;

  @Column(name = "model", length = 64)
  private String model;

  @Column(name = "prompt_tokens")
  private Integer promptTokens;

  @Column(name = "completion_tokens")
  private Integer completionTokens;

  @Column(name = "error_message", columnDefinition = "TEXT")
  private String errorMessage;

  @Column(name = "progress_message", length = 512)
  private String progressMessage;

  @Column(name = "progress_percent")
  private Integer progressPercent;

  @Column(name = "started_at")
  private Instant startedAt;

  @Column(name = "finished_at")
  private Instant finishedAt;
}
