package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.QuestionSourceEnum;
import com.courseenglish.api.util.constant.QuestionStatusEnum;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResQuestionDTO {
    private UUID id;
    private UUID categoryId;
    private String categoryName;
    private QuestionTypeEnum questionType;
    private QuestionStatusEnum status;
    private String title;
    private String promptText;
    private String promptLang;
    private String explanation;
    private String contentJson;
    private Integer difficulty;
    private String cefrLevel;
    private String skill;
    private String topic;
    private QuestionSourceEnum source;
    private boolean aiGenerated;
    private List<String> tags;
    private List<ResQuestionChoiceDTO> choices;
    private String createdBy;
    private String updatedBy;
    private Instant createdAt;
    private Instant updatedAt;
}
