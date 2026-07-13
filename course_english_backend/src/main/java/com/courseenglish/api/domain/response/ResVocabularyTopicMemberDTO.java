package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResVocabularyTopicMemberDTO {
    private UUID id;
    private UUID vocabularySetId;
    private String vocabularySetTitle;
    private String coverImageUrl;
    private String description;
    private String status;
    private String subjectName;
    private Long itemCount;
    private int displayOrder;
}
