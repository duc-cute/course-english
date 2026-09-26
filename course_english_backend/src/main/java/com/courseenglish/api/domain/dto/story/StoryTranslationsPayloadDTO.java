package com.courseenglish.api.domain.dto.story;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class StoryTranslationsPayloadDTO {

    /** Vietnamese title (optional — set by monologue generator). */
    private String titleVi;

    /** Vietnamese translation per sentence, aligned by sentenceIndex after merge. */
    private List<String> sentenceTranslations = new ArrayList<>();
    private List<StoryGlossaryEntryDTO> glossary = new ArrayList<>();
}
