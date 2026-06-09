package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReqCheckSystemConfigKeyDTO {
    private String configKey;
    private UUID id;
}
