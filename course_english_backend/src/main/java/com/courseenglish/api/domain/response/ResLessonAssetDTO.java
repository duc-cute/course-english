package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.LessonAssetTypeEnum;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResLessonAssetDTO {
    private UUID id;
    private UUID lessonId;
    private LessonAssetTypeEnum type;
    private String url;
    private String caption;
    private String metaJson;
    private int displayOrder;
}
