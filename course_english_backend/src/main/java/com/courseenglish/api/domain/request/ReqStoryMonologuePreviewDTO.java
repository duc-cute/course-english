package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqStoryMonologuePreviewDTO {

    /** Key trong MonologueThemeCatalog; null/blank = ngẫu nhiên. */
    private String themeGroup;

    private String level = "A2";
    private Integer readingTimeMinutes = 3;
}
