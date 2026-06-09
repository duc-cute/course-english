package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqSearchSystemConfigDTO extends ReqPagingSearchDTO {
    private String keyword;
}
