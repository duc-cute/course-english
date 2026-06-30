package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@Setter
public class ResQuestionStatsDTO {
    private long total;
    private Map<String, Long> byStatus = new LinkedHashMap<>();
    private Map<String, Long> byType = new LinkedHashMap<>();
    private long aiGeneratedCount;
}
