package com.courseenglish.api.service;

import com.courseenglish.api.domain.dto.GoogleVerifiedUserDTO;
import com.courseenglish.api.util.error.IdInvalidException;

public interface GoogleTokenVerifier {

    GoogleVerifiedUserDTO verify(String idToken) throws IdInvalidException;
}
