package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.PasswordResetNextStepEnum;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResForgotPasswordDTO {

    private PasswordResetNextStepEnum nextStep;
    private String message;
}
