package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResQuestionChoiceDTO {
    private UUID id;
    private String choiceKey;
    private String choiceText;
    private boolean correct;
    private int displayOrder;
}
