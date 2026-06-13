package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqSearchVocabularySetDTO extends ReqPagingSearchDTO {
    private String keyword;
    private String status;
    private UUID subjectId;
    /** Chỉ bộ từ thuộc môn của lớp HS đã ghi danh ACTIVE */
    private Boolean enrolledOnly;
    private UUID classroomId;
}
