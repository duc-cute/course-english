package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqStartExamAttemptDTO;
import com.courseenglish.api.domain.request.ReqSubmitExamAttemptDTO;
import com.courseenglish.api.domain.response.ResExamAttemptDTO;
import com.courseenglish.api.util.error.IdInvalidException;

public interface ExamAttemptService {

    ResExamAttemptDTO start(ReqStartExamAttemptDTO request) throws IdInvalidException;

    ResExamAttemptDTO submit(ReqSubmitExamAttemptDTO request) throws IdInvalidException;
}
