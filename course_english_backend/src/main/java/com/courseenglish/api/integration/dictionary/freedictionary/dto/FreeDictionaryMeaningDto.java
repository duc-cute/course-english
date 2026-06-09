package com.courseenglish.api.integration.dictionary.freedictionary.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class FreeDictionaryMeaningDto {
    private String partOfSpeech;
    private List<FreeDictionaryDefinitionDto> definitions;
    private List<String> synonyms;
    private List<String> antonyms;
}
