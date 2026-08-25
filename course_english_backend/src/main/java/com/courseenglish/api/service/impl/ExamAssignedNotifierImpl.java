package com.courseenglish.api.service.impl;

import com.courseenglish.api.service.ExamAssignEmailService;
import com.courseenglish.api.service.ExamAssignedNotifier;
import com.courseenglish.api.service.ExamAssignmentNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

@Service
public class ExamAssignedNotifierImpl implements ExamAssignedNotifier {

    private static final Logger log = LoggerFactory.getLogger(ExamAssignedNotifierImpl.class);

    private final ExamAssignmentNotificationService examAssignmentNotificationService;
    private final ExamAssignEmailService examAssignEmailService;

    public ExamAssignedNotifierImpl(
            ExamAssignmentNotificationService examAssignmentNotificationService,
            ExamAssignEmailService examAssignEmailService) {
        this.examAssignmentNotificationService = examAssignmentNotificationService;
        this.examAssignEmailService = examAssignEmailService;
    }

    @Override
    public void dispatchExamAssignedAsync(UUID assignmentId, UUID actorUserId) {
        // Async đọc DB ở thread khác — phải đợi commit, không thì findById thấy "not found".
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    runDispatch(assignmentId, actorUserId);
                }
            });
            return;
        }
        runDispatch(assignmentId, actorUserId);
    }

    private void runDispatch(UUID assignmentId, UUID actorUserId) {
        log.debug("Dispatch exam assigned notify: assignmentId={}", assignmentId);
        examAssignmentNotificationService.notifyExamAssignedAsync(assignmentId, actorUserId);
        examAssignEmailService.sendExamAssignedEmailsAsync(assignmentId, actorUserId);
    }
}
