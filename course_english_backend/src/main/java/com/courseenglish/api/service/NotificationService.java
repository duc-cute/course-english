package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqSearchNotificationDTO;
import com.courseenglish.api.domain.response.ResNotificationDTO;
import com.courseenglish.api.domain.response.ResNotificationMarkAllReadDTO;
import com.courseenglish.api.domain.response.ResNotificationUnreadCountDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.UUID;

public interface NotificationService {
    ResultPaginationDTO search(ReqSearchNotificationDTO request) throws IdInvalidException;

    ResNotificationUnreadCountDTO getUnreadCount() throws IdInvalidException;

    ResNotificationDTO markRead(UUID notificationId) throws IdInvalidException;

    ResNotificationMarkAllReadDTO markAllRead() throws IdInvalidException;
}
