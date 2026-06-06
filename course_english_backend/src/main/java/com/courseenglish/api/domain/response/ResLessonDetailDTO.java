package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ResLessonDetailDTO extends ResLessonDTO {
    private List<ResLessonBlockDTO> blocks;
    private List<ResLessonAssetDTO> assets;
}
