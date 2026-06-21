package com.courseenglish.api.service.reminder;

import com.courseenglish.api.domain.SessionReminder;
import com.courseenglish.api.repository.SessionReminderRepository;
import com.courseenglish.api.service.SessionReminderEmailService;
import com.courseenglish.api.util.constant.SessionReminderStatusEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class SessionReminderWorker {

    private static final Logger log = LoggerFactory.getLogger(SessionReminderWorker.class);

    private final SessionReminderRepository sessionReminderRepository;
    private final SessionReminderEmailService sessionReminderEmailService;

    public SessionReminderWorker(
            SessionReminderRepository sessionReminderRepository,
            SessionReminderEmailService sessionReminderEmailService) {
        this.sessionReminderRepository = sessionReminderRepository;
        this.sessionReminderEmailService = sessionReminderEmailService;
    }

    @Scheduled(cron = "0 */5 * * * *")
    public void processDueReminders() {
        Instant now = Instant.now();
        List<SessionReminder> due = sessionReminderRepository
                .findTop50ByStatusAndRemindAtLessThanEqualAndVoidedFalseOrderByRemindAtAsc(
                        SessionReminderStatusEnum.PENDING, now);
        if (due.isEmpty()) {
            return;
        }
        log.debug("Processing {} due session reminder(s)", due.size());
        for (SessionReminder reminder : due) {
            try {
                sessionReminderEmailService.processReminder(reminder.getId());
            } catch (Exception ex) {
                log.warn("Session reminder worker failed for {}: {}", reminder.getId(), ex.getMessage());
            }
        }
    }
}
