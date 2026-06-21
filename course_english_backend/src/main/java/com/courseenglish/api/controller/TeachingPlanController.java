package com.courseenglish.api.controller;

import com.courseenglish.api.domain.response.ResTeachingPlanDTO;
import com.courseenglish.api.service.ClassSessionService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/teacher/teaching-plan")
public class TeachingPlanController {

    private final ClassSessionService classSessionService;

    public TeachingPlanController(ClassSessionService classSessionService) {
        this.classSessionService = classSessionService;
    }

    @GetMapping("/today")
    @ApiMessage("Fetch today's teaching plan")
    public ResponseEntity<ResTeachingPlanDTO> getToday() throws IdInvalidException {
        return ResponseEntity.ok(classSessionService.getTeachingPlanToday());
    }

    @GetMapping("")
    @ApiMessage("Fetch teaching plan by date")
    public ResponseEntity<ResTeachingPlanDTO> getByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) throws IdInvalidException {
        return ResponseEntity.ok(classSessionService.getTeachingPlanByDate(date));
    }

    @GetMapping("/range")
    @ApiMessage("Fetch teaching plan by date range")
    public ResponseEntity<ResTeachingPlanDTO> getByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) throws IdInvalidException {
        return ResponseEntity.ok(classSessionService.getTeachingPlanRange(from, to));
    }
}
