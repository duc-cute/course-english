package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.VocabularySetStatusEnum;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResVocabularySetDTO {
    private UUID id;
    private String title;
    private String description;
    private UUID subjectId;
    private String subjectName;
    private VocabularySetStatusEnum status;
    private long itemCount;
    private List<ResVocabularyItemDTO> items;
    private Instant createdAt;
    private Instant updatedAt;
}
