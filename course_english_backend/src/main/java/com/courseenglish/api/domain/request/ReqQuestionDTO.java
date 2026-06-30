package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.QuestionSourceEnum;
import com.courseenglish.api.util.constant.QuestionStatusEnum;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ReqQuestionDTO {
    private UUID categoryId;
    private QuestionTypeEnum questionType;
    private QuestionStatusEnum status;

    private String title;

    @NotBlank(message = "promptText is required")
    private String promptText;

    private String promptLang;
    private String explanation;
    private String contentJson;
    private Integer difficulty;
    private String cefrLevel;
    private String skill;
    private String topic;
    private QuestionSourceEnum source;
    private Boolean aiGenerated;
    private List<String> tags;

    @Valid
    private List<ReqQuestionChoiceDTO> choices;
}
