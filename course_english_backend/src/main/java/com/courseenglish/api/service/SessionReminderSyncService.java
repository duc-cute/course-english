package com.courseenglish.api.service;

import com.courseenglish.api.domain.ClassSession;

import java.util.Collection;
import java.util.UUID;

public interface SessionReminderSyncService {

    void syncForSession(ClassSession session);

    void syncForSessionIds(Collection<UUID> sessionIds);
}
