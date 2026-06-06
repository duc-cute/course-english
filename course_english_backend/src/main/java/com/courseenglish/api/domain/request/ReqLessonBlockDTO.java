package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.LessonBlockTypeEnum;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqLessonBlockDTO {
    private LessonBlockTypeEnum blockType;
    private int displayOrder;
    private String payloadJson;
}
