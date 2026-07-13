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
public class SpeechPlatformElevenLabsVoiceDto {
  @JsonProperty("voiceId")
  private String voiceId;

  private String name;
  private String category;
  private String gender;
  private String accent;
  private String age;
  private String description;

  @JsonProperty("previewUrl")
  private String previewUrl;

  @JsonProperty("freeApiHint")
  private Boolean freeApiHint;

  @JsonProperty("availableForTiers")
  private List<String> availableForTiers = new ArrayList<>();
}
