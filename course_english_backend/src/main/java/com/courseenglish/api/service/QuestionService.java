package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqBulkQuestionDTO;
import com.courseenglish.api.domain.request.ReqExportQuestionsDTO;
import com.courseenglish.api.domain.request.ReqQuestionDTO;
import com.courseenglish.api.domain.request.ReqSearchQuestionDTO;
import com.courseenglish.api.domain.response.ResBulkQuestionResultDTO;
import com.courseenglish.api.domain.response.ResQuestionExportDTO;
import com.courseenglish.api.domain.response.ResQuestionCategoryDTO;
import com.courseenglish.api.domain.response.ResQuestionDTO;
import com.courseenglish.api.domain.response.ResQuestionStatsDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.List;
import java.util.UUID;

public interface QuestionService {
    ResultPaginationDTO search(ReqSearchQuestionDTO req);

    ResQuestionDTO getById(UUID id) throws IdInvalidException;

    List<ResQuestionDTO> findByIds(List<UUID> ids);

    ResQuestionDTO create(ReqQuestionDTO request) throws IdInvalidException;

    ResQuestionDTO update(UUID id, ReqQuestionDTO request) throws IdInvalidException;

    void delete(UUID id) throws IdInvalidException;

    ResBulkQuestionResultDTO bulk(ReqBulkQuestionDTO request) throws IdInvalidException;

    ResQuestionExportDTO export(ReqExportQuestionsDTO request) throws IdInvalidException;

    List<ResQuestionCategoryDTO> listCategories();

    ResQuestionStatsDTO getStats();

    /** Giữ thứ tự refs; bỏ qua câu không tồn tại / không đủ điều kiện */
    List<ResQuestionDTO> findByIdsOrdered(List<UUID> ids, boolean publishedOnly);

    /** JSON array khớp FE ExerciseQuestion[] */
    String buildResolvedQuestionsJson(List<UUID> ids, boolean publishedOnly);

    /** Duplicate for AI rewrite fork (DRAFT copy + dup-from tag). */
    ResQuestionDTO duplicateForFork(UUID sourceId) throws IdInvalidException;
}
