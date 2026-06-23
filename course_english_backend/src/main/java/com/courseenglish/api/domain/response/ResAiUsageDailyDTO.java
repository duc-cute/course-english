package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResAiUsageDailyDTO {
    private String date;
    private long promptTokens;
    private long completionTokens;
    private long requestCount;
}
