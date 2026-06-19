package com.courseenglish.api.service.impl;

import com.courseenglish.api.config.PasswordResetProperties;
import com.courseenglish.api.domain.PasswordResetToken;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.response.ResForgotPasswordDTO;
import com.courseenglish.api.repository.PasswordResetTokenRepository;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.service.PasswordResetEmailService;
import com.courseenglish.api.service.PasswordResetService;
import com.courseenglish.api.service.UserService;
import com.courseenglish.api.util.constant.AuthProviderEnum;
import com.courseenglish.api.util.constant.PasswordResetNextStepEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final String CHECK_EMAIL_MESSAGE =
            "Nếu email đã đăng ký, bạn sẽ nhận hướng dẫn trong vài phút.";
    private static final String USE_GOOGLE_MESSAGE =
            "Email này được liên kết với Google. Tài khoản không dùng mật khẩu — vui lòng đăng nhập bằng Google.";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;
    private final PasswordResetEmailService passwordResetEmailService;
    private final PasswordResetProperties passwordResetProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetServiceImpl(
            UserRepository userRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            UserService userService,
            PasswordResetEmailService passwordResetEmailService,
            PasswordResetProperties passwordResetProperties) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.userService = userService;
        this.passwordResetEmailService = passwordResetEmailService;
        this.passwordResetProperties = passwordResetProperties;
    }

    @Override
    @Transactional
    public ResForgotPasswordDTO requestReset(String email) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmailAndVoidedFalse(normalizedEmail);

        if (user == null) {
            return new ResForgotPasswordDTO(PasswordResetNextStepEnum.CHECK_EMAIL, CHECK_EMAIL_MESSAGE);
        }

        if (user.getAuthProvider() == AuthProviderEnum.GOOGLE) {
            return new ResForgotPasswordDTO(PasswordResetNextStepEnum.USE_GOOGLE, USE_GOOGLE_MESSAGE);
        }

        issueResetTokenAndSendEmail(user);
        return new ResForgotPasswordDTO(PasswordResetNextStepEnum.CHECK_EMAIL, CHECK_EMAIL_MESSAGE);
    }

    @Override
    @Transactional
    public void resetPassword(String rawToken, String newPassword) throws IdInvalidException {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IdInvalidException("Token không hợp lệ hoặc đã hết hạn");
        }

        String tokenHash = hashToken(rawToken.trim());
        PasswordResetToken token = passwordResetTokenRepository
                .findActiveByTokenHash(tokenHash, Instant.now())
                .orElseThrow(() -> new IdInvalidException("Token không hợp lệ hoặc đã hết hạn"));

        User user = token.getUser();
        if (user == null || user.isVoided()) {
            throw new IdInvalidException("Token không hợp lệ hoặc đã hết hạn");
        }

        if (user.getAuthProvider() == AuthProviderEnum.GOOGLE) {
            throw new IdInvalidException("Tài khoản đăng nhập Google không thể đặt mật khẩu qua liên kết này");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userService.handleSaveUser(user);
        userService.updateUserToken(null, user.getEmail());

        token.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(token);
    }

    private void issueResetTokenAndSendEmail(User user) {
        passwordResetTokenRepository.voidActiveTokensForUser(user.getId(), Instant.now());

        String rawToken = generateRawToken();
        PasswordResetToken entity = new PasswordResetToken();
        entity.setUser(user);
        entity.setTokenHash(hashToken(rawToken));
        entity.setExpiresAt(Instant.now().plus(passwordResetProperties.getTokenTtlMinutes(), ChronoUnit.MINUTES));
        passwordResetTokenRepository.save(entity);

        passwordResetEmailService.sendPasswordResetEmailAsync(user.getId(), rawToken);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }
}
