package com.courseenglish.api.service.impl;

import org.springframework.stereotype.Service;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.dto.GoogleVerifiedUserDTO;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.service.GoogleAuthService;
import com.courseenglish.api.service.GoogleTokenVerifier;
import com.courseenglish.api.service.UserService;
import com.courseenglish.api.util.AppConstants;
import com.courseenglish.api.util.constant.AuthProviderEnum;
import com.courseenglish.api.util.error.IdInvalidException;

@Service
public class GoogleAuthServiceImpl implements GoogleAuthService {

    private final GoogleTokenVerifier googleTokenVerifier;
    private final UserRepository userRepository;
    private final UserService userService;

    public GoogleAuthServiceImpl(
            GoogleTokenVerifier googleTokenVerifier,
            UserRepository userRepository,
            UserService userService) {
        this.googleTokenVerifier = googleTokenVerifier;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Override
    public User authenticateWithGoogle(String idToken) throws IdInvalidException {
        GoogleVerifiedUserDTO googleUser = googleTokenVerifier.verify(idToken);

        User byGoogleId = userRepository.findByGoogleIdAndVoidedFalse(googleUser.sub());
        if (byGoogleId != null) {
            return refreshProfileFromGoogle(byGoogleId, googleUser);
        }

        User byEmail = userRepository.findByEmailAndVoidedFalse(googleUser.email());
        if (byEmail != null) {
            return linkGoogleToExistingUser(byEmail, googleUser);
        }

        if (!AppConstants.studentSelfRegistrationEnabled) {
            throw new IdInvalidException(
                    "Email chưa được đăng ký. Hệ thống tạm thời không cho phép tự đăng ký tài khoản");
        }

        return createGoogleUser(googleUser);
    }

    private User linkGoogleToExistingUser(User user, GoogleVerifiedUserDTO googleUser) throws IdInvalidException {
        if (user.getGoogleId() != null && !user.getGoogleId().equals(googleUser.sub())) {
            throw new IdInvalidException("Email đã liên kết với tài khoản Google khác");
        }

        user.setGoogleId(googleUser.sub());
        if (user.getAuthProvider() == AuthProviderEnum.LOCAL) {
            user.setAuthProvider(AuthProviderEnum.LINKED);
        }
        return refreshProfileFromGoogle(user, googleUser);
    }

    private User createGoogleUser(GoogleVerifiedUserDTO googleUser) {
        User user = new User();
        user.setEmail(googleUser.email());
        user.setName(resolveDisplayName(googleUser));
        user.setGoogleId(googleUser.sub());
        user.setAvatarUrl(trimOrNull(googleUser.picture()));
        user.setAuthProvider(AuthProviderEnum.GOOGLE);
        user.setPassword(null);
        return userService.handleCreateUser(user);
    }

    private User refreshProfileFromGoogle(User user, GoogleVerifiedUserDTO googleUser) {
        boolean changed = false;

        if (googleUser.picture() != null && !googleUser.picture().isBlank()) {
            String picture = trimOrNull(googleUser.picture());
            if (picture != null && (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank())) {
                user.setAvatarUrl(picture);
                changed = true;
            }
        }

        if ((user.getName() == null || user.getName().isBlank()) && googleUser.name() != null && !googleUser.name().isBlank()) {
            user.setName(googleUser.name().trim());
            changed = true;
        }

        return changed ? userService.handleSaveUser(user) : user;
    }

    private String resolveDisplayName(GoogleVerifiedUserDTO googleUser) {
        if (googleUser.name() != null && !googleUser.name().isBlank()) {
            return googleUser.name().trim();
        }
        int at = googleUser.email().indexOf('@');
        return at > 0 ? googleUser.email().substring(0, at) : googleUser.email();
    }

    private String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
