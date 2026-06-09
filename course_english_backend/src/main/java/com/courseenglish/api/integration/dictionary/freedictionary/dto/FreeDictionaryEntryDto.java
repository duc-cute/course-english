package com.courseenglish.api.integration.dictionary.freedictionary.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * One element of the JSON array returned by
 * {@code GET /api/v2/entries/en/{word}} — see {@code data.md} sample.
 */
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class FreeDictionaryEntryDto {
    private String word;
    private String phonetic;
    private List<FreeDictionaryPhoneticDto> phonetics;
    private List<FreeDictionaryMeaningDto> meanings;
    private FreeDictionaryLicenseDto license;
    private List<String> sourceUrls;
}
