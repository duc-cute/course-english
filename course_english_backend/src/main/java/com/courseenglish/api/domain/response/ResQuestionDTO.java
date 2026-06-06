package com.courseenglish.api.domain.response;

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
    private String promptText;
    private String promptLang;
    private String explanation;
    private String contentJson;
    private Integer difficulty;
    private List<String> tags;
    private List<ResQuestionChoiceDTO> choices;
    private Instant createdAt;
    private Instant updatedAt;
}
