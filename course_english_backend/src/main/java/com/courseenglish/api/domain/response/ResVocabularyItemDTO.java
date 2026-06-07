package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResVocabularyItemDTO {
    private UUID id;
    private String wordEn;
    private String meaningVi;
    private String phonetic;
    private UUID imageAssetId;
    private UUID audioAssetId;
    private int displayOrder;
}
