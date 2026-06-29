package com.courseenglish.api.service.activitylog;

import com.courseenglish.api.util.constant.ActivityLogActionEnum;
import com.courseenglish.api.util.constant.ActivityLogModuleEnum;
import com.courseenglish.api.util.constant.ActivityLogSeverityEnum;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public class ActivityLogWriteContext {

  private ActivityLogSeverityEnum severity = ActivityLogSeverityEnum.ERROR;
  private ActivityLogModuleEnum module = ActivityLogModuleEnum.SYSTEM;
  private ActivityLogActionEnum action;
  private String message;
  private String detail;
  /** Override default detail truncation (e.g. full section prompt for debugging). */
  private Integer detailMaxChars;
  private final Map<String, Object> context = new LinkedHashMap<>();
  private String refType;
  private UUID refId;
  private UUID userId;
  private String httpMethod;
  private String requestPath;
  private Integer httpStatus;

  public static ActivityLogWriteContext of(
      ActivityLogSeverityEnum severity,
      ActivityLogModuleEnum module,
      ActivityLogActionEnum action,
      String message) {
    ActivityLogWriteContext ctx = new ActivityLogWriteContext();
    ctx.severity = severity;
    ctx.module = module;
    ctx.action = action;
    ctx.message = message;
    return ctx;
  }

  public ActivityLogWriteContext detail(String detail) {
    this.detail = detail;
    return this;
  }

  public ActivityLogWriteContext detailMaxChars(int maxChars) {
    this.detailMaxChars = maxChars;
    return this;
  }

  public ActivityLogWriteContext userId(UUID userId) {
    this.userId = userId;
    return this;
  }

  public ActivityLogWriteContext ref(String refType, UUID refId) {
    this.refType = refType;
    this.refId = refId;
    return this;
  }

  public ActivityLogWriteContext put(String key, Object value) {
    if (key != null && value != null) {
      context.put(key, value);
    }
    return this;
  }

  public ActivityLogWriteContext http(String method, String path, Integer status) {
    this.httpMethod = method;
    this.requestPath = path;
    this.httpStatus = status;
    return this;
  }

  public ActivityLogSeverityEnum getSeverity() {
    return severity;
  }

  public ActivityLogModuleEnum getModule() {
    return module;
  }

  public ActivityLogActionEnum getAction() {
    return action;
  }

  public String getMessage() {
    return message;
  }

  public String getDetail() {
    return detail;
  }

  public Integer getDetailMaxChars() {
    return detailMaxChars;
  }

  public Map<String, Object> getContext() {
    return context;
  }

  public String getRefType() {
    return refType;
  }

  public UUID getRefId() {
    return refId;
  }

  public UUID getUserId() {
    return userId;
  }

  public String getHttpMethod() {
    return httpMethod;
  }

  public String getRequestPath() {
    return requestPath;
  }

  public Integer getHttpStatus() {
    return httpStatus;
  }
}
