package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqResetPasswordDTO {

    @NotBlank(message = "token không được để trống")
    private String token;

    @NotBlank(message = "password không được để trống")
    @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự")
    private String newPassword;
}
