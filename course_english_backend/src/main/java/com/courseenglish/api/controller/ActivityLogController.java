package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqSearchActivityLogDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.ActivityLogService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/activity-logs")
public class ActivityLogController {

  private final ActivityLogService activityLogService;

  public ActivityLogController(ActivityLogService activityLogService) {
    this.activityLogService = activityLogService;
  }

  @PostMapping("/search")
  @ApiMessage("Search activity logs (admin)")
  public ResponseEntity<ResultPaginationDTO> search(@RequestBody(required = false) ReqSearchActivityLogDTO req)
      throws IdInvalidException {
    return ResponseEntity.ok(activityLogService.search(req));
  }
}
