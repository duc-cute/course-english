package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResVocabularyTopicDTO {
    private UUID id;
    private UUID journeyId;
    private String journeyTitle;
    private String slug;
    private String title;
    private String subtitle;
    private String coverImageUrl;
    private String themeColor;
    private int displayOrder;
    private String status;
    private int setCount;
    private List<ResVocabularyTopicMemberDTO> members = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;
}
