package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.response.ResTtsVoiceCatalogDTO;

import java.util.List;

public interface StoryVoiceCatalogService {
    List<ResTtsVoiceCatalogDTO> listActiveVoices(String profileKey);
}
