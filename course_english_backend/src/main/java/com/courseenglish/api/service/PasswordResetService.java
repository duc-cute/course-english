package com.courseenglish.api.service;

import com.courseenglish.api.domain.response.ResForgotPasswordDTO;
import com.courseenglish.api.util.error.IdInvalidException;

public interface PasswordResetService {

    ResForgotPasswordDTO requestReset(String email);

    void resetPassword(String rawToken, String newPassword) throws IdInvalidException;
}
