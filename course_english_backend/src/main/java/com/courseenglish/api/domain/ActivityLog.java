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
    name = "activity_logs",
    indexes = {
        @Index(name = "idx_activity_log_occurred", columnList = "occurred_at"),
        @Index(name = "idx_activity_log_severity", columnList = "severity,occurred_at"),
        @Index(name = "idx_activity_log_module", columnList = "module,action,occurred_at"),
        @Index(name = "idx_activity_log_user", columnList = "user_id,occurred_at"),
        @Index(name = "idx_activity_log_ref", columnList = "ref_type,ref_id")
    })
@Getter
@Setter
public class ActivityLog extends BaseObject {

  @Column(name = "severity", nullable = false, length = 16, columnDefinition = "varchar(16)")
  private String severity;

  @Column(name = "module", nullable = false, length = 40, columnDefinition = "varchar(40)")
  private String module;

  @Column(name = "action", nullable = false, length = 80, columnDefinition = "varchar(80)")
  private String action;

  @Column(name = "message", nullable = false, length = 500)
  private String message;

  @Column(name = "detail", columnDefinition = "TEXT")
  private String detail;

  @Column(name = "context_json", columnDefinition = "TEXT")
  private String contextJson;

  @Column(name = "ref_type", length = 40)
  private String refType;

  @JdbcTypeCode(SqlTypes.CHAR)
  @Column(name = "ref_id", length = 36)
  private UUID refId;

  @Column(name = "http_method", length = 10)
  private String httpMethod;

  @Column(name = "request_path", length = 255)
  private String requestPath;

  @Column(name = "http_status")
  private Integer httpStatus;

  @JdbcTypeCode(SqlTypes.CHAR)
  @Column(name = "user_id", length = 36)
  private UUID userId;

  @Column(name = "occurred_at", nullable = false)
  private Instant occurredAt;
}
