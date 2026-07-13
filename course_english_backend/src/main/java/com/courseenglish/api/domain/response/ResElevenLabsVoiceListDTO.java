package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ResElevenLabsVoiceListDTO {
    private String provider = "elevenlabs";
    private String source = "v2";
    private int totalCount;
    private int freeApiHintCount;
    private List<ResElevenLabsVoiceDTO> voices = new ArrayList<>();
}
