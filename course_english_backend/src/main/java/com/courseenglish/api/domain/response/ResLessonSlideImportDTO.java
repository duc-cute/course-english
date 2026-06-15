package com.courseenglish.api.domain.response;

import java.util.List;
import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResLessonSlideImportDTO {
    private UUID blockId;
    private int slideCount;
    private int pdfCount;
    private String title;
    private List<ResLessonAssetDTO> assets;
}
