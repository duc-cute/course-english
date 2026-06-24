package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqSearchActivityLogDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.activitylog.ActivityLogWriteContext;
import com.courseenglish.api.util.error.IdInvalidException;

public interface ActivityLogService {

  void log(ActivityLogWriteContext context);

  ResultPaginationDTO search(ReqSearchActivityLogDTO req) throws IdInvalidException;
}
