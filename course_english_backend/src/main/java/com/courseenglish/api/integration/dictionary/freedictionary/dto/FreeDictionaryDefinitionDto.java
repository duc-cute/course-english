package com.courseenglish.api.integration.dictionary.freedictionary.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class FreeDictionaryDefinitionDto {
    private String definition;
    private List<String> synonyms;
    private List<String> antonyms;
}
