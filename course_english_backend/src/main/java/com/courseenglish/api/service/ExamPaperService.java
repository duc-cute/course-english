package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqExamPaperDTO;
import com.courseenglish.api.domain.request.ReqReorderExamSectionsDTO;
import com.courseenglish.api.domain.request.ReqSearchExamPaperDTO;
import com.courseenglish.api.domain.response.ResExamPaperDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.UUID;

public interface ExamPaperService {

    ResultPaginationDTO search(ReqSearchExamPaperDTO req);

    ResExamPaperDTO getById(UUID id) throws IdInvalidException;

    ResExamPaperDTO create(ReqExamPaperDTO request) throws IdInvalidException;

    ResExamPaperDTO update(UUID id, ReqExamPaperDTO request) throws IdInvalidException;

    void delete(UUID id) throws IdInvalidException;

    ResExamPaperDTO reorderSections(UUID examPaperId, ReqReorderExamSectionsDTO request) throws IdInvalidException;
}
