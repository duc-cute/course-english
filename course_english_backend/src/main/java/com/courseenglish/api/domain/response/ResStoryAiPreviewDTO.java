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
    /** Monologue generator only. */
    private String titleVi;
    private String storyFormat;
    private String visualStyle;
    private String themeGroup;
    /** Prompt BE tự ghép — lưu vào stories.prompt để truy vết. */
    private String prompt;
}
