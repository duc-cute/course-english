package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResVocabularyJourneyClassroomDTO {
    private UUID id;
    private UUID classroomId;
    private String classroomName;
}
