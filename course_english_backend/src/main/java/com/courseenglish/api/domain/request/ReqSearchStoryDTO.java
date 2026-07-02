package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqSearchStoryDTO extends ReqPagingSearchDTO {

    private String keyword;
    private String status;
    private String level;
    /** Student list: chỉ PUBLISHED */
    private Boolean publishedOnly;
}
