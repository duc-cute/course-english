package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqStoryDTO {

    @NotBlank(message = "title is required")
    private String title;

    @NotBlank(message = "content is required")
    private String content;

    private String level;
    private Integer readingTimeMinutes;
    private String prompt;
    private String coverImageUrl;
    private UUID vocabularySetId;
    private String status;
    private boolean aiGenerated;
    /** JSON bilingual pack from AI or admin. */
    private String translationsJson;
    /** JSON mapping profile -> selected voiceId. */
    private String voiceProfileJson;
    /** STORYBOOK | MONOLOGUE — null giữ nguyên (create: STORYBOOK). */
    private String storyFormat;
    /** PASTEL_STORYBOOK | INK_SKETCH — null: mặc định theo storyFormat. */
    private String visualStyle;
}
