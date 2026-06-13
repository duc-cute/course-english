package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqSearchVocabularySetDTO;
import com.courseenglish.api.domain.request.ReqVocabularySetDTO;
import com.courseenglish.api.domain.response.ResVocabularySetDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.data.jpa.domain.Specification;

import com.courseenglish.api.domain.VocabularySet;

import java.util.UUID;

public interface VocabularySetService {
    ResultPaginationDTO search(ReqSearchVocabularySetDTO req);

    ResultPaginationDTO searchWithSpec(ReqSearchVocabularySetDTO req, Specification<VocabularySet> spec);

    ResVocabularySetDTO getById(UUID id) throws IdInvalidException;

    ResVocabularySetDTO create(ReqVocabularySetDTO request) throws IdInvalidException;

    ResVocabularySetDTO update(UUID id, ReqVocabularySetDTO request) throws IdInvalidException;

    void delete(UUID id) throws IdInvalidException;

    /** JSON mảng items cho block VOCABULARY (student player). */
    String buildResolvedVocabularyJson(java.util.UUID setId, boolean publishedOnly);

    /** Enrich mọi từ trong bộ chưa có {@code enriched_at}. */
    int enrichAll(UUID setId, boolean force) throws IdInvalidException;
}
