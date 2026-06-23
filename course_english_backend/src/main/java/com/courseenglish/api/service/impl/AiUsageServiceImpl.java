package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.response.ResAiUsageDailyDTO;
import com.courseenglish.api.domain.response.ResAiUsageStatsDTO;
import com.courseenglish.api.repository.AiConversationRepository;
import com.courseenglish.api.repository.AiMessageRepository;
import com.courseenglish.api.service.AiUsageService;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiUsageServiceImpl implements AiUsageService {

    private final AiMessageRepository aiMessageRepository;
    private final AiConversationRepository aiConversationRepository;

    @Value("${app.ai.enabled:true}")
    private boolean aiEnabled;

    @Value("${app.ai.default-chat-model:google/gemini-2.0-flash-001}")
    private String defaultChatModel;

    @Value("${app.ai.daily-request-limit:50}")
    private int dailyRequestLimit;

    public AiUsageServiceImpl(
            AiMessageRepository aiMessageRepository,
            AiConversationRepository aiConversationRepository) {
        this.aiMessageRepository = aiMessageRepository;
        this.aiConversationRepository = aiConversationRepository;
    }

    @Override
    public ResAiUsageStatsDTO getSystemUsageStats() throws IdInvalidException {
        requireStaffUser();

        ZoneId zone = ZoneId.systemDefault();
        Instant todayStart = LocalDate.now(zone).atStartOfDay(zone).toInstant();
        Instant todayEnd = todayStart.plusSeconds(24 * 60 * 60);
        Instant sevenDaysStart = LocalDate.now(zone).minusDays(6).atStartOfDay(zone).toInstant();

        long[] allTime = readTokenSums(aiMessageRepository.sumAssistantTokensAllTime());
        long[] today = readTokenSums(aiMessageRepository.sumAssistantTokensInRange(todayStart, todayEnd));

        ResAiUsageStatsDTO dto = new ResAiUsageStatsDTO();
        dto.setAiEnabled(aiEnabled);
        dto.setDefaultModel(defaultChatModel);
        dto.setDailyRequestLimitPerUser(dailyRequestLimit);

        dto.setTotalPromptTokens(allTime[0]);
        dto.setTotalCompletionTokens(allTime[1]);
        dto.setTotalTokens(allTime[0] + allTime[1]);

        dto.setTodayPromptTokens(today[0]);
        dto.setTodayCompletionTokens(today[1]);
        dto.setTodayTokens(today[0] + today[1]);
        dto.setTodayRequests(aiMessageRepository.countUserMessagesInRange(todayStart, todayEnd));

        dto.setTotalRequests(aiMessageRepository.countUserMessagesAllTime());
        dto.setTotalConversations(aiConversationRepository.countByVoidedFalse());
        dto.setActiveUsers(aiConversationRepository.countDistinctUsers());
        dto.setLast7Days(buildLast7Days(zone, sevenDaysStart));

        return dto;
    }

    private List<ResAiUsageDailyDTO> buildLast7Days(ZoneId zone, Instant since) {
        Map<LocalDate, ResAiUsageDailyDTO> byDate = new HashMap<>();
        for (Object[] row : aiMessageRepository.dailyUsageSince(since)) {
            LocalDate date = toLocalDate(row[0], zone);
            ResAiUsageDailyDTO item = new ResAiUsageDailyDTO();
            item.setDate(date.toString());
            item.setPromptTokens(toLong(row[1]));
            item.setCompletionTokens(toLong(row[2]));
            item.setRequestCount(toLong(row[3]));
            byDate.put(date, item);
        }

        LocalDate start = LocalDate.now(zone).minusDays(6);
        List<ResAiUsageDailyDTO> result = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = start.plusDays(i);
            ResAiUsageDailyDTO item = byDate.get(date);
            if (item == null) {
                item = new ResAiUsageDailyDTO();
                item.setDate(date.toString());
                item.setPromptTokens(0);
                item.setCompletionTokens(0);
                item.setRequestCount(0);
            }
            result.add(item);
        }
        return result;
    }

    private LocalDate toLocalDate(Object value, ZoneId zone) {
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        if (value instanceof Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        if (value instanceof java.util.Date utilDate) {
            return utilDate.toInstant().atZone(zone).toLocalDate();
        }
        return LocalDate.parse(value.toString());
    }

    private long[] readTokenSums(Object[] row) {
        if (row == null || row.length < 2) {
            return new long[] {0, 0};
        }
        return new long[] {toLong(row[0]), toLong(row[1])};
    }

    private long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(value.toString());
    }

    private void requireStaffUser() throws IdInvalidException {
        if (!SercurityUtil.isStaffUser()) {
            throw new IdInvalidException("Chỉ admin/giáo viên mới xem được thống kê AI");
        }
        SercurityUtil.getCurrentUserId()
                .orElseThrow(() -> new IdInvalidException("Không xác định được người dùng hiện tại"));
    }
}
