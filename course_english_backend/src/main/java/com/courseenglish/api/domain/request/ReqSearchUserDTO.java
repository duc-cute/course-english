package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqSearchUserDTO extends ReqPagingSearchDTO {
    private String keyword;
    private String roleName;
}
