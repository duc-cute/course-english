package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ReqLessonPracticeSummaryDTO {

    @NotEmpty(message = "lessonIds không được rỗng")
    @Size(max = 100, message = "Tối đa 100 lessonIds mỗi lần")
    private List<UUID> lessonIds;
}
