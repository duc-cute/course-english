package com.courseenglish.api.service;

import java.util.UUID;

public interface PasswordResetEmailService {

    void sendPasswordResetEmailAsync(UUID userId, String rawToken);
}
