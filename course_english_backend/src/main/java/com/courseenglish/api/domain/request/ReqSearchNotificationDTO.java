package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqSearchNotificationDTO extends ReqPagingSearchDTO {
    private Boolean unreadOnly = false;
}
