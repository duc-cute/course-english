package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.LessonAssetTypeEnum;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqLessonAssetDTO {
    private LessonAssetTypeEnum type;
    private String url;
    private String caption;
    private String metaJson;
    private int displayOrder;
}
