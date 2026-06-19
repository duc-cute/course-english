package com.courseenglish.api.domain.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqGoogleLoginDTO {

    @NotBlank(message = "idToken không được để trống")
    @JsonAlias("credential")
    private String idToken;
}
