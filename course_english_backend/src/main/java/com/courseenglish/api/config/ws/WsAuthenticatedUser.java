package com.courseenglish.api.config.ws;

import java.security.Principal;
import java.util.UUID;

public record WsAuthenticatedUser(UUID userId, String email) implements Principal {

    @Override
    public String getName() {
        return userId != null ? userId.toString() : email;
    }
}
