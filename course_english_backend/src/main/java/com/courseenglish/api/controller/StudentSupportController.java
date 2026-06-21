package com.courseenglish.api.controller;

import com.courseenglish.api.domain.response.ResStudentSupportDetailDTO;
import com.courseenglish.api.domain.response.ResStudentSupportItemDTO;
import com.courseenglish.api.domain.response.ResStudentSupportListDTO;
import com.courseenglish.api.domain.response.ResStudentSupportSummaryDTO;
import com.courseenglish.api.service.StudentSupportRiskService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.constant.StudentSupportRiskLevelEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teacher/students-need-support")
public class StudentSupportController {

    private final StudentSupportRiskService studentSupportRiskService;

    public StudentSupportController(StudentSupportRiskService studentSupportRiskService) {
        this.studentSupportRiskService = studentSupportRiskService;
    }

    @GetMapping("/summary")
    @ApiMessage("Fetch students need support summary")
    public ResponseEntity<ResStudentSupportSummaryDTO> getSummary(
            @RequestParam(required = false) UUID classroomId) throws IdInvalidException {
        return ResponseEntity.ok(studentSupportRiskService.getSummary(classroomId));
    }

    @GetMapping("")
    @ApiMessage("Search students need support")
    public ResponseEntity<ResStudentSupportListDTO> search(
            @RequestParam(required = false) UUID classroomId,
            @RequestParam(required = false) StudentSupportRiskLevelEnum riskLevel,
            @RequestParam(required = false) Integer minInactiveDays,
            @RequestParam(required = false) Integer minMissing,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) throws IdInvalidException {
        return ResponseEntity.ok(studentSupportRiskService.search(
                classroomId, riskLevel, minInactiveDays, minMissing, keyword, page, size));
    }

    @GetMapping("/widget")
    @ApiMessage("Fetch top at-risk students for dashboard widget")
    public ResponseEntity<List<ResStudentSupportItemDTO>> getWidget(
            @RequestParam(required = false) UUID classroomId) throws IdInvalidException {
        return ResponseEntity.ok(studentSupportRiskService.getWidget(classroomId));
    }

    @GetMapping("/{studentId}/detail")
    @ApiMessage("Fetch student support profile detail")
    public ResponseEntity<ResStudentSupportDetailDTO> getDetail(
            @PathVariable UUID studentId,
            @RequestParam UUID classroomId) throws IdInvalidException {
        return ResponseEntity.ok(studentSupportRiskService.getDetail(studentId, classroomId));
    }
}
