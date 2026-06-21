package com.courseenglish.api.service;

import com.courseenglish.api.domain.response.ResStudentSupportDetailDTO;
import com.courseenglish.api.domain.response.ResStudentSupportItemDTO;
import com.courseenglish.api.domain.response.ResStudentSupportListDTO;
import com.courseenglish.api.domain.response.ResStudentSupportSummaryDTO;
import com.courseenglish.api.util.constant.StudentSupportRiskLevelEnum;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.List;
import java.util.UUID;

public interface StudentSupportRiskService {

    ResStudentSupportSummaryDTO getSummary(UUID classroomId) throws IdInvalidException;

    ResStudentSupportListDTO search(
            UUID classroomId,
            StudentSupportRiskLevelEnum riskLevel,
            Integer minInactiveDays,
            Integer minMissing,
            String keyword,
            int page,
            int size) throws IdInvalidException;

    List<ResStudentSupportItemDTO> getWidget(UUID classroomId) throws IdInvalidException;

    ResStudentSupportDetailDTO getDetail(UUID studentId, UUID classroomId) throws IdInvalidException;
}
