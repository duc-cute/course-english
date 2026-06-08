package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqUpsertLessonReadingProgressDTO {

    private String lastBlockId;

    @Min(0)
    @Max(100)
    private int scrollPercent;

    @NotBlank(message = "lastTab is required")
    @Size(max = 16)
    private String lastTab = "study";

    private String lessonTitle;

    private String subjectName;
}
