package com.courseenglish.api.service;

import com.courseenglish.api.domain.User;
import com.courseenglish.api.util.error.IdInvalidException;

public interface GoogleAuthService {

    User authenticateWithGoogle(String idToken) throws IdInvalidException;
}
