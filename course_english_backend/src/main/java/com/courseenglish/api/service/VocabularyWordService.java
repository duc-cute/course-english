package com.courseenglish.api.service;

import com.courseenglish.api.domain.VocabularyWord;
import com.courseenglish.api.domain.request.ReqCreateVocabularyWordDTO;
import com.courseenglish.api.domain.request.ReqLookupVocabularyWordDTO;
import com.courseenglish.api.domain.request.ReqSearchVocabularyWordDTO;
import com.courseenglish.api.domain.request.ReqUpdateVocabularyWordDTO;
import com.courseenglish.api.domain.response.ResVocabularyWordDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VocabularyWordService {

    ResultPaginationDTO search(ReqSearchVocabularyWordDTO req);

    ResVocabularyWordDTO getById(UUID id) throws IdInvalidException;

    ResVocabularyWordDTO create(ReqCreateVocabularyWordDTO request) throws IdInvalidException;

    ResVocabularyWordDTO update(UUID id, ReqUpdateVocabularyWordDTO request) throws IdInvalidException;

    Optional<ResVocabularyWordDTO> lookupPreview(ReqLookupVocabularyWordDTO request);

    ResVocabularyWordDTO enrich(UUID id, boolean force) throws IdInvalidException;

    VocabularyWord findOrCreate(String wordEn, String meaningVi) throws IdInvalidException;

    int enrichBatch(List<UUID> wordIds, boolean force);

    ResVocabularyWordDTO toDto(VocabularyWord word);
}
