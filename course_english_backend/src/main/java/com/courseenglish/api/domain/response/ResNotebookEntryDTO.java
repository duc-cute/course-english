package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResNotebookEntryDTO {

    private UUID id;
    private UUID wordId;
    private String wordEn;
    private String meaningVi;
    private String phonetic;
    private String audioUkUrl;
    private String audioUsUrl;
    private String partOfSpeech;
    private UUID storyId;
    private String storyTitle;
    private String storySlug;
    private String contextSentence;
    private String reviewStatus;
    private Instant createdAt;
}
