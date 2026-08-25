package com.courseenglish.api.service;

import java.util.UUID;

public interface ExamAssignedNotifier {

    void dispatchExamAssignedAsync(UUID assignmentId, UUID actorUserId);
}
