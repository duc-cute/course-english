package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqCreateNotebookEntryDTO {

    @NotNull(message = "wordId is required")
    private UUID wordId;

    @NotNull(message = "storyId is required")
    private UUID storyId;

    private String contextSentence;
}
