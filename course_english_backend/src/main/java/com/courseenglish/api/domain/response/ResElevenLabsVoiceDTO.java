package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ResElevenLabsVoiceDTO {
    private String voiceId;
    private String name;
    private String category;
    private String gender;
    private String accent;
    private String age;
    private String description;
    private String previewUrl;
    private boolean freeApiHint;
    private List<String> availableForTiers = new ArrayList<>();
}
