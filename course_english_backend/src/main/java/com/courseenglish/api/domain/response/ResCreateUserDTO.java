package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;
import com.courseenglish.api.util.constant.GenderEnum;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResCreateUserDTO {
    private UUID id;

    private String email;

    private String name;

    private String address;

    private int age;

    private GenderEnum gender;

    private Instant createdAt;
    private CompanyUser company;

    @Getter
    @Setter
    public static class CompanyUser {
        private UUID id;
        private String name;
    }
}
