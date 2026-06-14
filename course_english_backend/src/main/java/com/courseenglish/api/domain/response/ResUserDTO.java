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
@AllArgsConstructor
@NoArgsConstructor
public class ResUserDTO {
    private UUID id;
    private String email;
    private String name;
    private String avatarUrl;
    private String address;
    private int age;
    private GenderEnum gender;
    private Instant createdAt;
    private Instant updatedAt;
    private CompanyUser company;
    /**
     * Primary role name for backward compatibility with existing frontend.
     * e.g. "USER_ROLE", "ADMIN_ROLE"
     */
    private String role;

    /**
     * All role names assigned to this user.
     */
    private List<String> roles;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CompanyUser {
        private UUID id;
        private String name;
    }

    // RoleUser removed: roles are now represented as strings in the API contract.
}
