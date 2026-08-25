package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqCreateExamAssignmentDTO;
import com.courseenglish.api.domain.request.ReqSearchExamAssignmentDTO;
import com.courseenglish.api.domain.response.ResExamAssignmentDTO;
import com.courseenglish.api.domain.response.ResExamClassScoreDTO;
import com.courseenglish.api.domain.response.ResStudentExamAssignmentDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.List;
import java.util.UUID;

public interface ExamAssignmentService {

    ResExamAssignmentDTO create(ReqCreateExamAssignmentDTO request) throws IdInvalidException;

    ResultPaginationDTO search(ReqSearchExamAssignmentDTO request) throws IdInvalidException;

    void cancel(UUID id) throws IdInvalidException;

    List<ResExamClassScoreDTO> listClassScores(UUID assignmentId) throws IdInvalidException;

    List<ResStudentExamAssignmentDTO> listAssignedForCurrentStudent(UUID classroomId)
            throws IdInvalidException;

    ResStudentExamAssignmentDTO getAssignedForCurrentStudent(UUID assignmentId, boolean includeSections)
            throws IdInvalidException;
}
