package com.courseenglish.api.service.impl;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.courseenglish.api.domain.dto.GoogleVerifiedUserDTO;
import com.courseenglish.api.service.GoogleTokenVerifier;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.Collections;

@Service
public class GoogleTokenVerifierImpl implements GoogleTokenVerifier {

    private final String clientId;
    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifierImpl(@Value("${app.google.client-id:}") String clientId) throws Exception {
        this.clientId = clientId == null ? "" : clientId.trim();
        if (this.clientId.isBlank()) {
            this.verifier = null;
        } else {
            this.verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(this.clientId))
                    .build();
        }
    }

    @Override
    public GoogleVerifiedUserDTO verify(String idToken) throws IdInvalidException {
        if (clientId.isBlank() || verifier == null) {
            throw new IdInvalidException("Google Sign-In chưa được cấu hình trên server");
        }
        if (idToken == null || idToken.isBlank()) {
            throw new IdInvalidException("Google token không hợp lệ");
        }

        GoogleIdToken googleIdToken;
        try {
            googleIdToken = verifier.verify(idToken.trim());
        } catch (Exception e) {
            throw new IdInvalidException("Không thể xác minh Google token");
        }

        if (googleIdToken == null) {
            throw new IdInvalidException("Google token không hợp lệ hoặc đã hết hạn");
        }

        GoogleIdToken.Payload payload = googleIdToken.getPayload();
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new IdInvalidException("Email Google chưa được xác minh");
        }

        String email = payload.getEmail();
        if (email == null || email.isBlank()) {
            throw new IdInvalidException("Google token thiếu email");
        }

        String sub = payload.getSubject();
        if (sub == null || sub.isBlank()) {
            throw new IdInvalidException("Google token thiếu định danh người dùng");
        }

        String name = payload.get("name") instanceof String s ? s.trim() : "";
        String picture = payload.get("picture") instanceof String p ? p.trim() : null;

        return new GoogleVerifiedUserDTO(sub, email.trim().toLowerCase(), name, picture);
    }
}
