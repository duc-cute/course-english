package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ResAiUsageStatsDTO {
    private boolean aiEnabled;
    private String defaultModel;
    private int dailyRequestLimitPerUser;

    private long totalPromptTokens;
    private long totalCompletionTokens;
    private long totalTokens;

    private long todayPromptTokens;
    private long todayCompletionTokens;
    private long todayTokens;
    private long todayRequests;

    private long totalRequests;
    private long totalConversations;
    private long activeUsers;

    private List<ResAiUsageDailyDTO> last7Days;
}
