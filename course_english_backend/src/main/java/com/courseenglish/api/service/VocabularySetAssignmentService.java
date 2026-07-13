package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqSearchVocabularySetAssignmentDTO;
import com.courseenglish.api.domain.request.ReqVocabularySetAssignmentDTO;
import com.courseenglish.api.domain.response.ResVocabularySetAssignmentDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.List;
import java.util.UUID;

public interface VocabularySetAssignmentService {

    ResVocabularySetAssignmentDTO create(ReqVocabularySetAssignmentDTO request) throws IdInvalidException;

    ResultPaginationDTO search(ReqSearchVocabularySetAssignmentDTO request) throws IdInvalidException;

    void cancel(UUID id) throws IdInvalidException;

    List<ResVocabularySetAssignmentDTO> listAssignedForCurrentStudent(UUID classroomId)
            throws IdInvalidException;

    ResVocabularySetAssignmentDTO getAssignedForCurrentStudent(UUID assignmentId)
            throws IdInvalidException;
}
