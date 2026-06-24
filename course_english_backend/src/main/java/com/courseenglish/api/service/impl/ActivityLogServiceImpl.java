package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.ActivityLog;
import com.courseenglish.api.domain.request.ReqSearchActivityLogDTO;
import com.courseenglish.api.domain.response.ResActivityLogDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.ActivityLogRepository;
import com.courseenglish.api.service.ActivityLogService;
import com.courseenglish.api.service.activitylog.ActivityLogWriteContext;
import com.courseenglish.api.service.activitylog.ActivityLogWriter;
import com.courseenglish.api.util.PagingSearchUtil;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.constant.ActivityLogActionEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ActivityLogServiceImpl implements ActivityLogService {

  private static final Logger log = LoggerFactory.getLogger(ActivityLogServiceImpl.class);

  private final ActivityLogRepository activityLogRepository;
  private final ActivityLogWriter activityLogWriter;

  public ActivityLogServiceImpl(
      ActivityLogRepository activityLogRepository,
      ActivityLogWriter activityLogWriter) {
    this.activityLogRepository = activityLogRepository;
    this.activityLogWriter = activityLogWriter;
  }

  @Override
  public void log(ActivityLogWriteContext context) {
    if (context == null || context.getAction() == null) {
      return;
    }
    try {
      activityLogWriter.persist(context);
    } catch (Exception e) {
      log.error(
          "[ActivityLog] persist failed action={}: {}",
          context.getAction().name(),
          e.getMessage(),
          e);
    }
  }

  @Override
  public ResultPaginationDTO search(ReqSearchActivityLogDTO req) throws IdInvalidException {
    requireAdmin();

    ReqSearchActivityLogDTO payload = req == null ? new ReqSearchActivityLogDTO() : req;
    if (payload.getSort() == null || payload.getSort().isBlank()) {
      payload.setSort("occurredAt,desc");
    }

    Specification<ActivityLog> spec = buildSearchSpec(payload);
    Pageable pageable = PagingSearchUtil.toPageable(payload);
    Page<ActivityLog> page = activityLogRepository.findAll(spec, pageable);

    ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
    meta.setPage(pageable.getPageNumber() + 1);
    meta.setPageSize(pageable.getPageSize());
    meta.setTotal(page.getTotalElements());
    meta.setPages(page.getTotalPages());

    ResultPaginationDTO dto = new ResultPaginationDTO();
    dto.setMeta(meta);
    dto.setResult(page.getContent().stream().map(this::toDto).collect(Collectors.toList()));
    return dto;
  }

  private Specification<ActivityLog> buildSearchSpec(ReqSearchActivityLogDTO payload) {
    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();
      predicates.add(cb.isFalse(root.get("voided")));

      String keyword = payload.getKeyword();
      if (keyword != null && !keyword.isBlank()) {
        String pattern = "%" + keyword.trim().toLowerCase() + "%";
        predicates.add(cb.or(
            cb.like(cb.lower(root.get("message")), pattern),
            cb.like(cb.lower(root.get("detail")), pattern)));
      }

      String severity = normalizeEnumFilter(payload.getSeverity());
      if (severity != null) {
        predicates.add(cb.equal(root.get("severity"), severity));
      }

      String module = normalizeEnumFilter(payload.getModule());
      if (module != null) {
        predicates.add(cb.equal(root.get("module"), module));
      }

      ActivityLogActionEnum actionFilter = parseAction(payload.getAction());
      if (actionFilter != null) {
        predicates.add(cb.equal(root.get("action"), actionFilter.name()));
      }

      if (payload.getUserId() != null) {
        predicates.add(cb.equal(root.get("userId"), payload.getUserId()));
      }

      if (payload.getRefType() != null && !payload.getRefType().isBlank()) {
        predicates.add(cb.equal(root.get("refType"), payload.getRefType().trim()));
      }

      if (payload.getRefId() != null) {
        predicates.add(cb.equal(root.get("refId"), payload.getRefId()));
      }

      if (payload.getFromOccurredAt() != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("occurredAt"), payload.getFromOccurredAt()));
      }

      if (payload.getToOccurredAt() != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("occurredAt"), payload.getToOccurredAt()));
      }

      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }

  private String normalizeEnumFilter(String raw) {
    if (raw == null || raw.isBlank()) {
      return null;
    }
    return raw.trim().toUpperCase();
  }

  private ActivityLogActionEnum parseAction(String raw) {
    if (raw == null || raw.isBlank()) {
      return null;
    }
    try {
      return ActivityLogActionEnum.valueOf(raw.trim().toUpperCase());
    } catch (IllegalArgumentException e) {
      return null;
    }
  }

  private void requireAdmin() throws IdInvalidException {
    if (!SercurityUtil.isAdminUser()) {
      throw new IdInvalidException("Chỉ quản trị viên mới xem được nhật ký hệ thống");
    }
  }

  private ResActivityLogDTO toDto(ActivityLog entity) {
    ResActivityLogDTO dto = new ResActivityLogDTO();
    dto.setId(entity.getId());
    dto.setSeverity(entity.getSeverity());
    dto.setModule(entity.getModule());
    dto.setAction(entity.getAction());
    dto.setMessage(entity.getMessage());
    dto.setDetail(entity.getDetail());
    dto.setContextJson(entity.getContextJson());
    dto.setRefType(entity.getRefType());
    dto.setRefId(entity.getRefId());
    dto.setHttpMethod(entity.getHttpMethod());
    dto.setRequestPath(entity.getRequestPath());
    dto.setHttpStatus(entity.getHttpStatus());
    dto.setUserId(entity.getUserId());
    dto.setOccurredAt(entity.getOccurredAt());
    dto.setCreatedAt(entity.getCreatedAt());
    return dto;
  }
}
