package com.courseenglish.api.config.ws;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;
import java.util.Optional;

@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private static final Logger log = LoggerFactory.getLogger(JwtHandshakeInterceptor.class);
    private static final String TOKEN_QUERY_PARAM = "token";

    private final WsJwtAuthService wsJwtAuthService;

    public JwtHandshakeInterceptor(WsJwtAuthService wsJwtAuthService) {
        this.wsJwtAuthService = wsJwtAuthService;
    }

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {
        Optional<String> token = resolveToken(request);
        if (token.isEmpty()) {
            log.debug("WS handshake rejected: missing JWT");
            return false;
        }

        Optional<WsAuthenticatedUser> user = wsJwtAuthService.authenticate(token.get());
        if (user.isEmpty()) {
            log.debug("WS handshake rejected: invalid JWT");
            return false;
        }

        WsAuthenticatedUser authenticated = user.get();
        attributes.put(WsSessionAttributes.USER_ID, authenticated.userId());
        attributes.put(WsSessionAttributes.USER_EMAIL, authenticated.email());
        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
        // no-op
    }

    private Optional<String> resolveToken(ServerHttpRequest request) {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            String queryToken = servletRequest.getServletRequest().getParameter(TOKEN_QUERY_PARAM);
            if (queryToken != null && !queryToken.isBlank()) {
                return Optional.of(queryToken.trim());
            }
        }

        String authorization = request.getHeaders().getFirst("Authorization");
        if (authorization != null && !authorization.isBlank()) {
            return Optional.of(authorization.trim());
        }

        return Optional.empty();
    }
}
