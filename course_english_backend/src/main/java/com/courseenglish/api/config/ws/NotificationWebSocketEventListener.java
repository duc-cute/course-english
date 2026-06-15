package com.courseenglish.api.config.ws;

import com.courseenglish.api.service.notification.ws.NotificationSessionRegistry;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@Component
public class NotificationWebSocketEventListener {

    private final NotificationSessionRegistry sessionRegistry;

    public NotificationWebSocketEventListener(NotificationSessionRegistry sessionRegistry) {
        this.sessionRegistry = sessionRegistry;
    }

    @EventListener
    public void onSessionConnected(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        UUID userId = resolveUserId(accessor);
        String sessionId = accessor.getSessionId();
        if (userId != null && sessionId != null) {
            sessionRegistry.register(sessionId, userId);
        }
    }

    @EventListener
    public void onSessionDisconnected(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        if (sessionId != null) {
            sessionRegistry.unregister(sessionId);
        }
    }

    private UUID resolveUserId(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        if (user instanceof WsAuthenticatedUser wsUser) {
            return wsUser.userId();
        }

        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes == null) {
            return null;
        }
        Object userIdObj = sessionAttributes.get(WsSessionAttributes.USER_ID);
        if (userIdObj instanceof UUID userId) {
            return userId;
        }
        return null;
    }
}
