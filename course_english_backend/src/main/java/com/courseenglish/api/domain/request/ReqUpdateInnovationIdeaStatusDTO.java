package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.InnovationIdeaStatusEnum;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqUpdateInnovationIdeaStatusDTO {

    @NotNull(message = "Trạng thái là bắt buộc")
    private InnovationIdeaStatusEnum status;
}
