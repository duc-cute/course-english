package com.courseenglish.api.integration.dictionary.freedictionary.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class FreeDictionaryPhoneticDto {
    private String text;
    private String audio;
    private String sourceUrl;
    private FreeDictionaryLicenseDto license;
}
