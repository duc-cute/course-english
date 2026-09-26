package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResFeatureFlagsDTO {
    private boolean dictionaryEnrichEnabled;
    private boolean vocabularyAudioEnabled;
    /** UK | US | BOTH */
    private String vocabularyAudioAccent;
    private boolean studentSelfRegistrationEnabled;
    private int vocabularyPracticeMaxQuestions;
    private int vocabularyPracticePassScore;
    /** Tên thương hiệu hiển thị trên app / email */
    private String brandName;
    /** URL logo header khi xuất Word (có thể rỗng) */
    private String wordExportLogoUrl;
    /** Watermark file đề Word (có thể rỗng) */
    private String wordExportWatermarkText;
}
