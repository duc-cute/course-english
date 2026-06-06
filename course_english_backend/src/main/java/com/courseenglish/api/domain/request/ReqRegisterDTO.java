package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import com.courseenglish.api.util.constant.GenderEnum;

@Getter
@Setter
public class ReqRegisterDTO {

    @NotBlank(message = "email không được để trống")
    private String email;

    @NotBlank(message = "name không được để trống")
    private String name;

    @NotBlank(message = "password không được để trống")
    private String password;

    private String address;

    private int age;

    private GenderEnum gender;
}
