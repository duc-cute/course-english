package com.courseenglish.api.domain.dto.story;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class StoryGlossaryEntryDTO {

    private String wordKey;
    private String wordEn;
    private String meaningVi;
    private String partOfSpeech;
    private String phonetic;
    private String audioUkUrl;
    private String audioUsUrl;
    private String imageUrl;
    private UUID vocabularyId;
    /** story | db | ai */
    private String meaningSource;
}
