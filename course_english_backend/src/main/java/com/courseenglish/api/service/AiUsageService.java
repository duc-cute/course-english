package com.courseenglish.api.service;

import com.courseenglish.api.domain.response.ResAiUsageStatsDTO;
import com.courseenglish.api.util.error.IdInvalidException;

public interface AiUsageService {
    ResAiUsageStatsDTO getSystemUsageStats() throws IdInvalidException;
}
