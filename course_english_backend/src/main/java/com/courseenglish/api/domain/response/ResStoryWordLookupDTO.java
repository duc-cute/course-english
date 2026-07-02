package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResStoryWordLookupDTO {

    private String wordEn;
    private String wordKey;
    private java.util.UUID vocabularyId;
    private String meaningVi;
    private String phonetic;
    private String audioUkUrl;
    private String audioUsUrl;
    private String partOfSpeech;
    private String exampleSentence;
    private boolean inDatabase;
    /** db | dictionary | none */
    private String meaningSource;
}
