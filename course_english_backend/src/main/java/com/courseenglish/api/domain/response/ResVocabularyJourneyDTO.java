package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResVocabularyJourneyDTO {
    private UUID id;
    private String title;
    private String description;
    private String coverImageUrl;
    private String status;
    private int displayOrder;
    private int topicCount;
    private int classroomCount;
    private List<ResVocabularyJourneyClassroomDTO> classrooms = new ArrayList<>();
    /** Student journey detail: published topics only. */
    private List<ResVocabularyTopicDTO> topics = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;
}
