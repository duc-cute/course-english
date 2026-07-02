package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResStoryCoverPreviewDTO {
    private String coverImageUrl;
    /** Final image prompt sent to image model (for admin preview/debug). */
    private String coverImagePrompt;
}
