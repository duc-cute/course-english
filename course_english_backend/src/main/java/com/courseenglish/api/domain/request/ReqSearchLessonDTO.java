package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqSearchLessonDTO extends ReqPagingSearchDTO {
    private String keyword;
    private UUID subjectId;
    private String status;
    /** Chỉ bài thuộc môn của lớp HS đã ghi danh ACTIVE */
    private Boolean enrolledOnly;
    /** Lọc thêm theo một lớp (phải đã ghi danh) — dùng cùng enrolledOnly */
    private UUID classroomId;
}
