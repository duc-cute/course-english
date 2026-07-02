package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResStoryAiPreviewDTO {

    private String title;
    private String content;
    private String level;
    private Integer readingTimeMinutes;
    private String translationsJson;
}
