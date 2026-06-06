package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.LessonStatusEnum;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResLessonDTO {
    private UUID id;
    private String title;
    private String summary;
    private LessonStatusEnum status;
    private int displayOrder;
    private UUID subjectId;
    private String subjectName;
    private long blockCount;
}
