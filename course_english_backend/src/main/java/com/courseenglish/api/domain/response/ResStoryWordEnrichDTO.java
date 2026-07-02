package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResStoryWordEnrichDTO {

    private String wordEn;
    private String wordKey;
    private String meaningVi;
    /** db | dictionary | ai */
    private String meaningSource;
    private Double confidence;
    private String enrichModel;
    private boolean cached;
}
