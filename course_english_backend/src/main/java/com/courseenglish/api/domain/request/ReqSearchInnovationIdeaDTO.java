package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.InnovationIdeaCategoryEnum;
import com.courseenglish.api.util.constant.InnovationIdeaSortModeEnum;
import com.courseenglish.api.util.constant.InnovationIdeaStatusEnum;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqSearchInnovationIdeaDTO extends ReqPagingSearchDTO {
    private String keyword;
    private InnovationIdeaCategoryEnum category;
    private InnovationIdeaStatusEnum status;
    private Boolean mine;
    private InnovationIdeaSortModeEnum sortMode;
}
