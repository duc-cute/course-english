package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.ClassSession;
import com.courseenglish.api.domain.SessionReminder;
import com.courseenglish.api.repository.ClassSessionRepository;
import com.courseenglish.api.repository.SessionReminderRepository;
import com.courseenglish.api.service.SessionReminderEmailService;
import com.courseenglish.api.service.SessionReminderSyncService;
import com.courseenglish.api.util.constant.SessionReminderChannelEnum;
import com.courseenglish.api.util.constant.SessionReminderStatusEnum;
import com.courseenglish.api.util.constant.SessionStatusEnum;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Collection;
import java.util.UUID;

@Service
public class SessionReminderSyncServiceImpl implements SessionReminderSyncService {

    static final ZoneId TEACHING_PLAN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    static final long LEAD_MINUTES = 15;

    private final SessionReminderRepository sessionReminderRepository;
    private final ClassSessionRepository classSessionRepository;
    private final SessionReminderEmailService sessionReminderEmailService;

    public SessionReminderSyncServiceImpl(
            SessionReminderRepository sessionReminderRepository,
            ClassSessionRepository classSessionRepository,
            SessionReminderEmailService sessionReminderEmailService) {
        this.sessionReminderRepository = sessionReminderRepository;
        this.classSessionRepository = classSessionRepository;
        this.sessionReminderEmailService = sessionReminderEmailService;
    }

    @Override
    @Transactional
    public void syncForSession(ClassSession session) {
        if (session == null || session.getId() == null) {
            return;
        }
        Instant now = Instant.now();
        SessionReminder reminder = sessionReminderRepository
                .findBySessionIdAndChannelAndVoidedFalse(session.getId(), SessionReminderChannelEnum.EMAIL)
                .orElseGet(SessionReminder::new);

        if (reminder.getStatus() == SessionReminderStatusEnum.SENT) {
            return;
        }

        if (!shouldSchedule(session, now)) {
            if (reminder.getId() != null) {
                reminder.setStatus(SessionReminderStatusEnum.CANCELLED);
                sessionReminderRepository.save(reminder);
            }
            return;
        }

        UUID teacherId = session.getTeacher() != null ? session.getTeacher().getId() : null;
        if (teacherId == null) {
            return;
        }

        long minutesUntilStart = Duration.between(now, session.getStartAt()).toMinutes();
        boolean sendImmediately = minutesUntilStart <= LEAD_MINUTES;

        reminder.setSessionId(session.getId());
        reminder.setTeacherId(teacherId);
        reminder.setChannel(SessionReminderChannelEnum.EMAIL);
        reminder.setRemindAt(sendImmediately ? now : session.getStartAt().minus(Duration.ofMinutes(LEAD_MINUTES)));
        reminder.setStatus(SessionReminderStatusEnum.PENDING);
        reminder.setLastError(null);
        SessionReminder saved = sessionReminderRepository.save(reminder);

        if (sendImmediately) {
            scheduleDispatchAfterCommit(saved.getId());
        }
    }

    @Override
    @Transactional
    public void syncForSessionIds(Collection<UUID> sessionIds) {
        if (sessionIds == null || sessionIds.isEmpty()) {
            return;
        }
        for (UUID sessionId : sessionIds) {
            classSessionRepository.findByIdAndVoidedFalse(sessionId).ifPresent(this::syncForSession);
        }
    }

    private boolean shouldSchedule(ClassSession session, Instant now) {
        if (session.isVoided()) {
            return false;
        }
        if (session.getStatus() == SessionStatusEnum.CANCELLED) {
            return false;
        }
        return session.getStartAt() != null && session.getStartAt().isAfter(now);
    }

    private void scheduleDispatchAfterCommit(UUID reminderId) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    sessionReminderEmailService.dispatchReminderAsync(reminderId);
                }
            });
        } else {
            sessionReminderEmailService.dispatchReminderAsync(reminderId);
        }
    }
}
