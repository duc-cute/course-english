package com.courseenglish.api.service;

import java.util.UUID;

public interface ExamAssignmentNotificationService {

    void notifyExamAssignedAsync(UUID assignmentId, UUID actorUserId);
}
