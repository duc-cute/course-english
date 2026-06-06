package com.courseenglish.api.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import com.courseenglish.api.util.constant.GenderEnum;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@Table(name ="users")
public class User extends BaseObject {

    @NotBlank(message = "email không được để trống")
    private String email;

    @NotBlank(message = "name không được để trống")
    private String name;

    @NotBlank(message = "password không được để trống")
    private String password;

    private String address;

    private int age;

    @Enumerated(EnumType.STRING)
    private GenderEnum gender;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String refreshToken;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    /**
     * Kept for backward-compat with existing controller/request payloads coming from frontend.
     * Frontend currently sends `role: "ADMIN_ROLE" | "USER_ROLE"`.
     */
    @Transient
    @Setter(AccessLevel.PUBLIC)
    private String role;

    /**
     * Request-only field: list of role names to assign. Uses key "roleNames" to avoid
     * collision with the persistent Set<Role> roles field which Jackson would try to
     * deserialize as UUID objects.
     */
    @Transient
    @JsonProperty("roleNames")
    @Setter(AccessLevel.PUBLIC)
    private List<String> rolesRequested;
}
