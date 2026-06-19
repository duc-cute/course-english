package com.courseenglish.api.service.impl;

import com.courseenglish.api.config.MailProperties;
import com.courseenglish.api.config.PasswordResetProperties;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.service.PasswordResetEmailService;
import com.courseenglish.api.service.mail.MailSenderService;
import com.courseenglish.api.service.mail.MailTemplateService;
import com.courseenglish.api.service.mail.RenderedMailMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class PasswordResetEmailServiceImpl implements PasswordResetEmailService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetEmailServiceImpl.class);

    private final UserRepository userRepository;
    private final MailTemplateService mailTemplateService;
    private final MailSenderService mailSenderService;
    private final MailProperties mailProperties;
    private final PasswordResetProperties passwordResetProperties;

    public PasswordResetEmailServiceImpl(
            UserRepository userRepository,
            MailTemplateService mailTemplateService,
            MailSenderService mailSenderService,
            MailProperties mailProperties,
            PasswordResetProperties passwordResetProperties) {
        this.userRepository = userRepository;
        this.mailTemplateService = mailTemplateService;
        this.mailSenderService = mailSenderService;
        this.mailProperties = mailProperties;
        this.passwordResetProperties = passwordResetProperties;
    }

    @Override
    @Async("emailExecutor")
    public void sendPasswordResetEmailAsync(UUID userId, String rawToken) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.isVoided()) {
            return;
        }

        String resetUrl = buildResetUrl(rawToken);
        if (!mailProperties.isConfigured()) {
            log.warn("Mail disabled — password reset link for {}: {}", user.getEmail(), resetUrl);
            return;
        }

        try {
            String recipientName = user.getName() != null && !user.getName().isBlank()
                    ? user.getName().trim()
                    : "bạn";
            RenderedMailMessage mail = mailTemplateService.renderPasswordReset(
                    user.getEmail(),
                    recipientName,
                    resetUrl,
                    passwordResetProperties.getTokenTtlMinutes());
            mailSenderService.send(mail);
        } catch (Exception ex) {
            log.error("Failed to send password reset email to {}", user.getEmail(), ex);
        }
    }

    private String buildResetUrl(String rawToken) {
        String base = mailProperties.getFrontendBaseUrl();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + "/reset-password?token=" + rawToken;
    }
}
