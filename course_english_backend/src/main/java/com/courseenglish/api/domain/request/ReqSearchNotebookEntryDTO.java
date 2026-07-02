package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqSearchNotebookEntryDTO extends ReqPagingSearchDTO {

    private UUID storyId;
    private String keyword;
}
