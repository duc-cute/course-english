package com.courseenglish.api.config.ws;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class WsJwtAuthService {

    private final JwtDecoder jwtDecoder;

    public WsJwtAuthService(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    public Optional<WsAuthenticatedUser> authenticate(String rawToken) {
        if (!StringUtils.hasText(rawToken)) {
            return Optional.empty();
        }
        try {
            Jwt jwt = jwtDecoder.decode(stripBearer(rawToken.trim()));
            return extractUser(jwt);
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    @SuppressWarnings("unchecked")
    private Optional<WsAuthenticatedUser> extractUser(Jwt jwt) {
        Object claim = jwt.getClaim("duccute");
        if (!(claim instanceof Map<?, ?> map)) {
            return Optional.empty();
        }
        Object id = map.get("id");
        if (id == null) {
            return Optional.empty();
        }
        try {
            UUID userId = UUID.fromString(id.toString());
            String email = jwt.getSubject();
            return Optional.of(new WsAuthenticatedUser(userId, email));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    private String stripBearer(String token) {
        if (token.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return token.substring(7).trim();
        }
        return token;
    }
}
