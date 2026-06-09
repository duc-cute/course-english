package com.courseenglish.api.integration.dictionary.freedictionary.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class FreeDictionaryLicenseDto {
    private String name;
    private String url;
}
