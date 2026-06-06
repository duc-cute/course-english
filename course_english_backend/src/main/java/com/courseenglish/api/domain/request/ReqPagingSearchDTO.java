package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqPagingSearchDTO {
    private Integer page = 0;
    private Integer size = 10;
    private String sort;
}
