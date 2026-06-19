package com.courseenglish.api.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.Role;
import com.courseenglish.api.domain.request.ReqChangePasswordDTO;
import com.courseenglish.api.domain.request.ReqForgotPasswordDTO;
import com.courseenglish.api.domain.request.ReqGoogleLoginDTO;
import com.courseenglish.api.domain.request.ReqLoginDTO;
import com.courseenglish.api.domain.request.ReqRegisterDTO;
import com.courseenglish.api.domain.request.ReqResetPasswordDTO;
import com.courseenglish.api.domain.response.ResCreateUserDTO;
import com.courseenglish.api.domain.response.ResForgotPasswordDTO;
import com.courseenglish.api.domain.response.ResLoginDTO;
import com.courseenglish.api.service.GoogleAuthService;
import com.courseenglish.api.service.PasswordResetService;
import com.courseenglish.api.service.UserService;
import com.courseenglish.api.util.AppConstants;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.constant.AuthProviderEnum;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final SercurityUtil sercurityUtil;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final GoogleAuthService googleAuthService;
    private final PasswordResetService passwordResetService;

    @Value("${duccute.jwt.refresh-token-validity-in-seconds}")
    private long refreshTokenExpiration;

    public AuthController(
            AuthenticationManagerBuilder authenticationManagerBuilder,
            SercurityUtil sercurityUtil,
            UserService userService,
            PasswordEncoder passwordEncoder,
            GoogleAuthService googleAuthService,
            PasswordResetService passwordResetService) {
        this.authenticationManagerBuilder = authenticationManagerBuilder;
        this.sercurityUtil = sercurityUtil;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.googleAuthService = googleAuthService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    public ResponseEntity<ResCreateUserDTO> register(@Valid @RequestBody ReqRegisterDTO registerDTO) throws IdInvalidException {
        if (!AppConstants.studentSelfRegistrationEnabled) {
            throw new IdInvalidException("Hệ thống tạm thời không cho phép tự đăng ký tài khoản");
        }

        User user = new User();
        user.setEmail(registerDTO.getEmail());
        user.setName(registerDTO.getName());
        user.setPassword(this.passwordEncoder.encode(registerDTO.getPassword()));
        user.setAddress(registerDTO.getAddress());
        user.setAge(registerDTO.getAge());
        user.setGender(registerDTO.getGender());
        user.setAuthProvider(AuthProviderEnum.LOCAL);

        User newUser = this.userService.handleCreateUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(this.userService.convertToResCreateUserDTO(newUser));
    }

    @PostMapping("/login")
    public ResponseEntity<ResLoginDTO> login(@Valid @RequestBody ReqLoginDTO loginDTO) throws IdInvalidException {
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                loginDTO.getUsername(), loginDTO.getPassword());

        Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);
        if (!authentication.isAuthenticated()) {
            throw new IdInvalidException("Thông tin đăng nhập không chính xác");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        User userInDB = this.userService.handleGetUserByUserName(loginDTO.getUsername());
        if (userInDB == null) {
            throw new IdInvalidException("Thông tin đăng nhập không chính xác");
        }

        return issueLoginResponse(userInDB);
    }

    @PostMapping("/google")
    @ApiMessage("Login with Google ID token")
    public ResponseEntity<ResLoginDTO> googleLogin(@Valid @RequestBody ReqGoogleLoginDTO dto) throws IdInvalidException {
        User user = googleAuthService.authenticateWithGoogle(dto.getIdToken());
        return issueLoginResponse(user);
    }

    @PostMapping("/forgot-password")
    @ApiMessage("Request password reset email")
    public ResponseEntity<ResForgotPasswordDTO> forgotPassword(@Valid @RequestBody ReqForgotPasswordDTO dto) {
        ResForgotPasswordDTO response = passwordResetService.requestReset(dto.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    @ApiMessage("Reset password with token from email")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ReqResetPasswordDTO dto) throws IdInvalidException {
        passwordResetService.resetPassword(dto.getToken(), dto.getNewPassword());
        return ResponseEntity.ok(null);
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@RequestBody ReqChangePasswordDTO dto) throws IdInvalidException {
        String email = SercurityUtil.getCurrentUserLogin().isPresent() ? SercurityUtil.getCurrentUserLogin().get() : "";
        User currentUser = this.userService.handleGetUserByUserName(email);
        if (currentUser != null) {
            if (currentUser.getAuthProvider() == AuthProviderEnum.GOOGLE) {
                throw new IdInvalidException("Tài khoản đăng nhập Google không thể đổi mật khẩu tại đây");
            }

            UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                    currentUser.getEmail(), dto.getCurrentPass());
            Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);
            if (!authentication.isAuthenticated()) {
                throw new IdInvalidException("Thông tin đăng nhập không chính xác");
            }

            String password = this.passwordEncoder.encode(dto.getNewPass());
            currentUser.setPassword(password);
            if (currentUser.getAuthProvider() == null) {
                currentUser.setAuthProvider(AuthProviderEnum.LOCAL);
            }
            this.userService.handleSaveUser(currentUser);
        }

        return ResponseEntity.ok(null);
    }

    @GetMapping("/account")
    @ApiMessage("Fetch account")
    public ResponseEntity<ResLoginDTO.UserGetAccount> getAccount() {
        String email = SercurityUtil.getCurrentUserLogin().isPresent()
                ? SercurityUtil.getCurrentUserLogin().get()
                : "";
        User currentUser = this.userService.handleGetUserByUserName(email);

        ResLoginDTO.UserLogin userLgin = new ResLoginDTO.UserLogin();
        ResLoginDTO.UserGetAccount userGetAccount = new ResLoginDTO.UserGetAccount();

        if (currentUser != null) {
            userLgin.setId(currentUser.getId());
            userLgin.setName(currentUser.getName());
            userLgin.setAvatarUrl(currentUser.getAvatarUrl());
            userLgin.setEmail(currentUser.getEmail());
            userLgin.setGender(currentUser.getGender());
            userLgin.setAddress(currentUser.getAddress());
            userLgin.setAge(currentUser.getAge());
            attachRoles(userLgin, currentUser);
            userGetAccount.setUser(userLgin);
        }
        return ResponseEntity.ok(userGetAccount);
    }

    @GetMapping("/refresh")
    @ApiMessage("Get user by refresh token")
    public ResponseEntity<ResLoginDTO> getRefreshToken(
            @CookieValue(name = "refresh_token", defaultValue = "notToken") String refreshToken) throws IdInvalidException {
        if (refreshToken.equals("notToken")) {
            throw new IdInvalidException("Không tồn tại refresh token trong cookie");
        }

        Jwt jwtDecodedToken = this.sercurityUtil.checkValidRefreshToken(refreshToken);
        String email = jwtDecodedToken.getSubject();

        User user = this.userService.getUserByRefreshTokenAndEmail(refreshToken, email);
        if (user == null) {
            throw new IdInvalidException("User không hợp lệ");
        }

        User currentUser = this.userService.handleGetUserByUserName(user.getEmail());
        if (currentUser == null) {
            throw new IdInvalidException("User không hợp lệ");
        }

        return issueLoginResponse(currentUser);
    }

    @PostMapping("/logout")
    @ApiMessage("logout")
    public ResponseEntity<Void> logout() throws IdInvalidException {
        String email = SercurityUtil.getCurrentUserLogin().isPresent() ? SercurityUtil.getCurrentUserLogin().get() : "";
        if (email.isEmpty()) {
            throw new IdInvalidException("Access token khng hợp lệ");
        }

        this.userService.updateUserToken(null, email);
        ResponseCookie deletedCookie = ResponseCookie
                .from("refresh_token", null)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deletedCookie.toString())
                .body(null);
    }

    private ResponseEntity<ResLoginDTO> issueLoginResponse(User userInDB) {
        ResLoginDTO res = new ResLoginDTO();
        ResLoginDTO.UserLogin userLogin = toUserLogin(userInDB);
        attachRoles(userLogin, userInDB);
        res.setUser(userLogin);

        String accessToken = this.sercurityUtil.createAccessToken(userInDB.getEmail(), res);
        res.setAccessToken(accessToken);

        String refreshToken = sercurityUtil.createRefreshToken(userInDB.getEmail(), res);
        this.userService.updateUserToken(refreshToken, userInDB.getEmail());

        ResponseCookie resCookie = ResponseCookie
                .from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(refreshTokenExpiration)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, resCookie.toString())
                .body(res);
    }

    private ResLoginDTO.UserLogin toUserLogin(User user) {
        ResLoginDTO.UserLogin userLogin = new ResLoginDTO.UserLogin();
        userLogin.setId(user.getId());
        userLogin.setEmail(user.getEmail());
        userLogin.setName(user.getName());
        userLogin.setAvatarUrl(user.getAvatarUrl());
        userLogin.setAddress(user.getAddress());
        userLogin.setAge(user.getAge());
        userLogin.setGender(user.getGender());
        return userLogin;
    }

    private void attachRoles(ResLoginDTO.UserLogin userLogin, User user) {
        List<String> roleNames = user.getRoles() == null
                ? Collections.emptyList()
                : user.getRoles().stream()
                .map(Role::getName)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        userLogin.setRoles(roleNames);
        userLogin.setRole(roleNames.isEmpty() ? null : roleNames.get(0));
    }
}
