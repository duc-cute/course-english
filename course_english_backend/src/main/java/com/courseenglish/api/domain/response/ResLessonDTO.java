package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.LessonStatusEnum;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResLessonDTO {
    private UUID id;
    private String title;
    private String slug;
    private String summary;
    private String coverImageUrl;
    private LessonStatusEnum status;
    private int displayOrder;
    private Instant dueAt;
    private UUID subjectId;
    private String subjectName;
    private long blockCount;
}
