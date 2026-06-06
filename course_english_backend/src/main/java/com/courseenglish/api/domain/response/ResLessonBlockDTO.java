package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.LessonBlockTypeEnum;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResLessonBlockDTO {
    private UUID id;
    private UUID lessonId;
    private LessonBlockTypeEnum blockType;
    private int displayOrder;
    private String payloadJson;
    /** QUESTION_REF: câu hỏi resolve từ bank — chỉ có ở GET /lessons/{id}/detail */
    private String resolvedQuestionsJson;
}
