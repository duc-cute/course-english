package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqCreateVocabularyPracticeAttemptDTO;
import com.courseenglish.api.domain.request.ReqVocabularyPracticeSummaryDTO;
import com.courseenglish.api.domain.response.ResVocabularyPracticeAttemptDTO;
import com.courseenglish.api.domain.response.ResVocabularyPracticeSummaryItemDTO;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.List;
import java.util.UUID;

public interface VocabularyPracticeAttemptService {

    ResVocabularyPracticeAttemptDTO create(ReqCreateVocabularyPracticeAttemptDTO request)
            throws IdInvalidException;

    ResVocabularyPracticeAttemptDTO getLatest(UUID vocabularySetId) throws IdInvalidException;

    ResVocabularyPracticeAttemptDTO getBest(UUID vocabularySetId) throws IdInvalidException;

    List<ResVocabularyPracticeAttemptDTO> listBySet(UUID vocabularySetId) throws IdInvalidException;

    List<ResVocabularyPracticeSummaryItemDTO> getSummary(ReqVocabularyPracticeSummaryDTO request)
            throws IdInvalidException;
}
