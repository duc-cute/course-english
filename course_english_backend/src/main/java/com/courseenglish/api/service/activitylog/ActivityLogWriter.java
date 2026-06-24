package com.courseenglish.api.service.activitylog;

import com.courseenglish.api.domain.ActivityLog;
import com.courseenglish.api.repository.ActivityLogRepository;
import com.courseenglish.api.util.constant.ActivityLogModuleEnum;
import com.courseenglish.api.util.constant.ActivityLogSeverityEnum;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Component
public class ActivityLogWriter {

  private static final int MAX_MESSAGE_LEN = 500;
  private static final int MAX_DETAIL_LEN = 8000;

  private final ActivityLogRepository activityLogRepository;
  private final ObjectMapper objectMapper;

  public ActivityLogWriter(ActivityLogRepository activityLogRepository, ObjectMapper objectMapper) {
    this.activityLogRepository = activityLogRepository;
    this.objectMapper = objectMapper;
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void persist(ActivityLogWriteContext context) {
    ActivityLog entity = new ActivityLog();
    ActivityLogSeverityEnum severity = context.getSeverity() != null
        ? context.getSeverity()
        : ActivityLogSeverityEnum.ERROR;
    ActivityLogModuleEnum module = context.getModule() != null
        ? context.getModule()
        : ActivityLogModuleEnum.SYSTEM;

    entity.setSeverity(severity.name());
    entity.setModule(module.name());
    entity.setAction(context.getAction().name());
    entity.setMessage(truncate(context.getMessage(), MAX_MESSAGE_LEN, "Activity log"));
    entity.setDetail(truncate(context.getDetail(), MAX_DETAIL_LEN, null));
    entity.setContextJson(serializeContext(context.getContext()));
    entity.setRefType(context.getRefType());
    entity.setRefId(context.getRefId());
    entity.setHttpMethod(context.getHttpMethod());
    entity.setRequestPath(context.getRequestPath());
    entity.setHttpStatus(context.getHttpStatus());
    entity.setUserId(context.getUserId());
    entity.setOccurredAt(Instant.now());
    activityLogRepository.saveAndFlush(entity);
  }

  private String serializeContext(Map<String, Object> context) {
    if (context == null || context.isEmpty()) {
      return null;
    }
    try {
      return objectMapper.writeValueAsString(context);
    } catch (JsonProcessingException e) {
      return null;
    }
  }

  private String truncate(String value, int maxLen, String fallback) {
    String text = value == null || value.isBlank() ? fallback : value.trim();
    if (text == null) {
      return null;
    }
    if (text.length() <= maxLen) {
      return text;
    }
    return text.substring(0, maxLen);
  }
}
