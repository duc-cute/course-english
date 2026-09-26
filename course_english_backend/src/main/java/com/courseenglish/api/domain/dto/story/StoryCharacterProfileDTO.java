package com.courseenglish.api.domain.dto.story;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StoryCharacterProfileDTO {
    private String name;
    private Integer age;
    private String gender;
    private String hair;
    private String clothing;
    private String appearance;
    private String artStyle;
    private String colorStyle;
    private String referenceImageUrl;
}
