package com.courseenglish.api.controller;

import com.courseenglish.api.domain.response.ResAiUsageStatsDTO;
import com.courseenglish.api.service.AiUsageService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai/usage")
public class AiUsageController {

    private final AiUsageService aiUsageService;

    public AiUsageController(AiUsageService aiUsageService) {
        this.aiUsageService = aiUsageService;
    }

    @GetMapping("/stats")
    @ApiMessage("Get system-wide AI usage stats")
    public ResponseEntity<ResAiUsageStatsDTO> stats() throws IdInvalidException {
        return ResponseEntity.ok(aiUsageService.getSystemUsageStats());
    }
}
