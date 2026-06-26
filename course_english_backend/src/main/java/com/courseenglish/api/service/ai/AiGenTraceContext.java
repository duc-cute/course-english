package com.courseenglish.api.service.ai;

import java.util.UUID;

/**
 * Correlates activity-log steps for one question-generation task (OpenRouter timing).
 */
public class AiGenTraceContext {

  private final UUID taskId;
  private final UUID userId;
  private final UUID documentId;
  private final String documentSource;
  private int openRouterTotalMs;
  private int openRouterAttempts;

  public AiGenTraceContext(UUID taskId, UUID userId, UUID documentId) {
    this(taskId, userId, documentId, null);
  }

  public AiGenTraceContext(UUID taskId, UUID userId, UUID documentId, String documentSource) {
    this.taskId = taskId;
    this.userId = userId;
    this.documentId = documentId;
    this.documentSource = documentSource;
  }

  public UUID getTaskId() {
    return taskId;
  }

  public UUID getUserId() {
    return userId;
  }

  public UUID getDocumentId() {
    return documentId;
  }

  public String getDocumentSource() {
    return documentSource;
  }

  public int getOpenRouterTotalMs() {
    return openRouterTotalMs;
  }

  public int getOpenRouterAttempts() {
    return openRouterAttempts;
  }

  public void addOpenRouterRound(int durationMs) {
    openRouterAttempts++;
    openRouterTotalMs += durationMs;
  }
}
