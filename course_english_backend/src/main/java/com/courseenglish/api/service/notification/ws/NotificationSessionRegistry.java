package com.courseenglish.api.service.notification.ws;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class NotificationSessionRegistry {

    private static final Logger log = LoggerFactory.getLogger(NotificationSessionRegistry.class);

    private final ConcurrentMap<UUID, Set<String>> sessionsByUser = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, UUID> userBySession = new ConcurrentHashMap<>();

    public void register(String sessionId, UUID userId) {
        if (sessionId == null || sessionId.isBlank() || userId == null) {
            return;
        }
        userBySession.put(sessionId, userId);
        sessionsByUser
                .computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet())
                .add(sessionId);
        log.debug("WS session registered: userId={}, sessionId={}", userId, sessionId);
    }

    public void unregister(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return;
        }
        UUID userId = userBySession.remove(sessionId);
        if (userId == null) {
            return;
        }
        Set<String> sessions = sessionsByUser.get(userId);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (sessions.isEmpty()) {
                sessionsByUser.remove(userId, sessions);
            }
        }
        log.debug("WS session unregistered: userId={}, sessionId={}", userId, sessionId);
    }

    public Set<String> getSessionIds(UUID userId) {
        if (userId == null) {
            return Set.of();
        }
        Set<String> sessions = sessionsByUser.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return Set.of();
        }
        return Collections.unmodifiableSet(sessions);
    }

    public boolean isOnline(UUID userId) {
        return !getSessionIds(userId).isEmpty();
    }
}
