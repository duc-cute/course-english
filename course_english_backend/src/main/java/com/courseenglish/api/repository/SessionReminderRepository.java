package com.courseenglish.api.repository;

import com.courseenglish.api.domain.SessionReminder;
import com.courseenglish.api.util.constant.SessionReminderChannelEnum;
import com.courseenglish.api.util.constant.SessionReminderStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionReminderRepository extends JpaRepository<SessionReminder, UUID> {

    Optional<SessionReminder> findBySessionIdAndChannelAndVoidedFalse(
            UUID sessionId, SessionReminderChannelEnum channel);

    List<SessionReminder> findTop50ByStatusAndRemindAtLessThanEqualAndVoidedFalseOrderByRemindAtAsc(
            SessionReminderStatusEnum status, Instant remindAt);
}
