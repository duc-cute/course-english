package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqSearchNotificationDTO;
import com.courseenglish.api.domain.response.ResNotificationDTO;
import com.courseenglish.api.domain.response.ResNotificationMarkAllReadDTO;
import com.courseenglish.api.domain.response.ResNotificationUnreadCountDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.NotificationService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/search")
    @ApiMessage("Search notifications")
    public ResponseEntity<ResultPaginationDTO> search(@RequestBody(required = false) ReqSearchNotificationDTO request)
            throws IdInvalidException {
        return ResponseEntity.ok(notificationService.search(request));
    }

    @GetMapping("/unread-count")
    @ApiMessage("Get unread notification count")
    public ResponseEntity<ResNotificationUnreadCountDTO> getUnreadCount() throws IdInvalidException {
        return ResponseEntity.ok(notificationService.getUnreadCount());
    }

    @PostMapping("/{id}/read")
    @ApiMessage("Mark notification as read")
    public ResponseEntity<ResNotificationDTO> markRead(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(notificationService.markRead(id));
    }

    @PostMapping("/read-all")
    @ApiMessage("Mark all notifications as read")
    public ResponseEntity<ResNotificationMarkAllReadDTO> markAllRead() throws IdInvalidException {
        return ResponseEntity.ok(notificationService.markAllRead());
    }
}
