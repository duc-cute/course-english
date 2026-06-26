package com.courseenglish.api.util.constant;

/**
 * Stored in DB as plain VARCHAR (max ~20 chars) — avoid long names / MySQL ENUM truncation.
 */
public enum ActivityLogActionEnum {
  AI_GEN_PROMPT,
  AI_GEN_RESPONSE,
  AI_GEN_TASK_CREATED,
  AI_GEN_START,
  AI_GEN_SKIP,
  AI_GEN_POLL_TIMEOUT,
  AI_GEN_FAILED,
  AI_GEN_QUOTA,
  AI_DOC_READY,
  AI_DOC_FAIL,
  AI_OR_ROUND,
  AI_OR_ERROR,
  AI_OR_TIMEOUT,
  AI_JSON_INVALID,
  API_ERROR
}
