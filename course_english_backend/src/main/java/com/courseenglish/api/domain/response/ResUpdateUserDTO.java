package com.courseenglish.api.domain.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.courseenglish.api.util.constant.GenderEnum;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResUpdateUserDTO {
    private UUID id;
    private String email;
    private String name;
    private String address;
    private int age;
    private GenderEnum gender;
    private Instant updatedAt;

    private CompanyUser company;
    /**
     * Primary role name for backward compatibility with existing frontend.
     */
    private String role;

    /**
     * All role names assigned to this user.
     */
    private List<String> roles;

    @Getter
    @Setter
    public static class CompanyUser {
        private UUID id;
        private String name;
    }

    // RoleUser removed: roles are now represented as strings in the API contract.
}
