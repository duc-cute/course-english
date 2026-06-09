package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResVocabularyWordDTO {
    private UUID id;
    private String wordKey;
    private String wordEn;
    private String meaningVi;
    private String phonetic;
    private String audioUkUrl;
    private String audioUsUrl;
    private String partOfSpeech;
    private String exampleSentence;
    private UUID imageAssetId;
    private UUID audioAssetId;
    private Instant enrichedAt;
    private String enrichSource;
    private Instant createdAt;
    private Instant updatedAt;
}
