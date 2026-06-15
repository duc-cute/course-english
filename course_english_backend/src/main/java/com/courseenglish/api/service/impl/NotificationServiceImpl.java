package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Notification;
import com.courseenglish.api.domain.request.ReqSearchNotificationDTO;
import com.courseenglish.api.domain.response.ResNotificationDTO;
import com.courseenglish.api.domain.response.ResNotificationMarkAllReadDTO;
import com.courseenglish.api.domain.response.ResNotificationUnreadCountDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.NotificationRepository;
import com.courseenglish.api.service.NotificationService;
import com.courseenglish.api.service.notification.NotificationMapper;
import com.courseenglish.api.util.PagingSearchUtil;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository, NotificationMapper notificationMapper) {
        this.notificationRepository = notificationRepository;
        this.notificationMapper = notificationMapper;
    }

    @Override
    public ResultPaginationDTO search(ReqSearchNotificationDTO request) throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        ReqSearchNotificationDTO payload = request == null ? new ReqSearchNotificationDTO() : request;
        if (payload.getSort() == null || payload.getSort().isBlank()) {
            payload.setSort("createdAt,desc");
        }
        Pageable pageable = PagingSearchUtil.toPageable(payload);
        boolean unreadOnly = Boolean.TRUE.equals(payload.getUnreadOnly());

        Page<Notification> page = unreadOnly
                ? notificationRepository.findByUserIdAndReadAtIsNullAndVoidedFalseOrderByCreatedAtDesc(userId, pageable)
                : notificationRepository.findByUserIdAndVoidedFalseOrderByCreatedAtDesc(userId, pageable);

        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setTotal(page.getTotalElements());
        meta.setPages(page.getTotalPages());

        ResultPaginationDTO dto = new ResultPaginationDTO();
        dto.setMeta(meta);
        dto.setResult(page.getContent().stream().map(notificationMapper::toDto).collect(Collectors.toList()));
        return dto;
    }

    @Override
    public ResNotificationUnreadCountDTO getUnreadCount() throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        ResNotificationUnreadCountDTO dto = new ResNotificationUnreadCountDTO();
        dto.setCount(notificationRepository.countByUserIdAndReadAtIsNullAndVoidedFalse(userId));
        return dto;
    }

    @Override
    @Transactional
    public ResNotificationDTO markRead(UUID notificationId) throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        Notification row = notificationRepository.findByIdAndUserIdAndVoidedFalse(notificationId, userId)
                .orElseThrow(() -> new IdInvalidException("Thông báo không tồn tại."));
        if (row.getReadAt() == null) {
            row.setReadAt(Instant.now());
            notificationRepository.save(row);
        }
        return notificationMapper.toDto(row);
    }

    @Override
    @Transactional
    public ResNotificationMarkAllReadDTO markAllRead() throws IdInvalidException {
        UUID userId = requireCurrentUserId();
        int updated = notificationRepository.markAllRead(userId, Instant.now());
        ResNotificationMarkAllReadDTO dto = new ResNotificationMarkAllReadDTO();
        dto.setUpdatedCount(updated);
        return dto;
    }

    private UUID requireCurrentUserId() throws IdInvalidException {
        return SercurityUtil.getCurrentUserId()
                .orElseThrow(() -> new IdInvalidException("Cần đăng nhập để xem thông báo."));
    }
}
