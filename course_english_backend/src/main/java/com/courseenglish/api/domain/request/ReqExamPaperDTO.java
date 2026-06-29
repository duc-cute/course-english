package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.ExamPaperStatusEnum;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ReqExamPaperDTO {

    @NotBlank(message = "title is required")
    private String title;

    private String instruction;
    private Integer durationMinutes;
    private Integer passScorePercent;
    private ExamPaperStatusEnum status;
    private UUID subjectId;

    @Valid
    private List<ReqExamSectionDTO> sections;
}
