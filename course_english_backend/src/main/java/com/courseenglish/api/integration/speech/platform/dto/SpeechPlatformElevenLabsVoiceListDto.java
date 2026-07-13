package com.courseenglish.api.integration.speech.platform.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class SpeechPlatformElevenLabsVoiceListDto {
  private String provider;
  private String source;

  @JsonProperty("totalCount")
  private Integer totalCount;

  @JsonProperty("freeApiHintCount")
  private Integer freeApiHintCount;

  private List<SpeechPlatformElevenLabsVoiceDto> voices = new ArrayList<>();
}
