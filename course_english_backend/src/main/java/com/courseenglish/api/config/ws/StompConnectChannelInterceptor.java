package com.courseenglish.api.config.ws;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.UUID;

/**
 * Binds authenticated user from HTTP handshake attributes onto the STOMP CONNECT frame.
 * Also accepts Authorization on CONNECT for non-SockJS clients.
 */
@Component
public class StompConnectChannelInterceptor implements ChannelInterceptor {

    private final WsJwtAuthService wsJwtAuthService;

    public StompConnectChannelInterceptor(WsJwtAuthService wsJwtAuthService) {
        this.wsJwtAuthService = wsJwtAuthService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() != StompCommand.CONNECT) {
            return message;
        }

        WsAuthenticatedUser user = resolveUser(accessor);
        if (user != null) {
            accessor.setUser(user);
        }
        return message;
    }

    private WsAuthenticatedUser resolveUser(StompHeaderAccessor accessor) {
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes != null) {
            Object userIdObj = sessionAttributes.get(WsSessionAttributes.USER_ID);
            Object emailObj = sessionAttributes.get(WsSessionAttributes.USER_EMAIL);
            if (userIdObj instanceof UUID userId) {
                String email = emailObj instanceof String s ? s : null;
                return new WsAuthenticatedUser(userId, email);
            }
        }

        String authorization = accessor.getFirstNativeHeader("Authorization");
        if (StringUtils.hasText(authorization)) {
            return wsJwtAuthService.authenticate(authorization).orElse(null);
        }
        return null;
    }
}
