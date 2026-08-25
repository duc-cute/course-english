package com.courseenglish.api.service;

import java.util.UUID;

public interface ExamAssignEmailService {

    void sendExamAssignedEmailsAsync(UUID assignmentId, UUID actorUserId);
}
