package com.courseenglish.api.service.ai;

import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Component
public class AiAccessSupport {

  @Value("${app.ai.enabled:true}")
  private boolean aiEnabled;

  public void requireAiEnabled() throws IdInvalidException {
    if (!aiEnabled) {
      throw new IdInvalidException("Tính năng AI đang tắt");
    }
  }

  public void requireStaffUser() throws IdInvalidException {
    if (!SercurityUtil.isStaffUser()) {
      throw new IdInvalidException("Chỉ giáo viên hoặc quản trị mới dùng được tính năng này");
    }
  }

  public UUID currentUserId() throws IdInvalidException {
    return SercurityUtil.getCurrentUserId()
        .orElseThrow(() -> new IdInvalidException("Không xác định được người dùng hiện tại"));
  }

  public List<String> parseSupportedGenTypes(String csv) {
    if (csv == null || csv.isBlank()) {
      return List.of("MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK");
    }
    return Arrays.stream(csv.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .map(String::toUpperCase)
        .toList();
  }
}
