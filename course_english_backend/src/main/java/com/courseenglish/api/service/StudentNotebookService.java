package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqCreateNotebookEntryDTO;
import com.courseenglish.api.domain.request.ReqSearchNotebookEntryDTO;
import com.courseenglish.api.domain.response.ResNotebookEntryDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.UUID;

public interface StudentNotebookService {

    ResultPaginationDTO search(ReqSearchNotebookEntryDTO req) throws IdInvalidException;

    ResNotebookEntryDTO save(ReqCreateNotebookEntryDTO request) throws IdInvalidException;

    void delete(UUID id) throws IdInvalidException;
}
