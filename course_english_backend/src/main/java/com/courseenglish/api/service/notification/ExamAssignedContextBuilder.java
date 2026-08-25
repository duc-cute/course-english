package com.courseenglish.api.service.notification;

import com.courseenglish.api.domain.dto.notification.ExamAssignedNotifyContext;

import java.util.Optional;
import java.util.UUID;

public interface ExamAssignedContextBuilder {

    Optional<ExamAssignedNotifyContext> build(UUID assignmentId, UUID actorUserId);
}
