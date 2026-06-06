package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResQuestionCategoryDTO {
    private UUID id;
    private String name;
    private String slug;
    private UUID parentId;
    private int displayOrder;
}
