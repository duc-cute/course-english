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
}
