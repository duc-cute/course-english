package com.courseenglish.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "roles")
@Getter
@Setter
public class Role extends BaseObject {
    @NotBlank(message = "name is required")
    private String name; // e.g. USER_ROLE, ADMIN_ROLE

    /**
     * DB schema hiện tại có cột `code` không nullable, nên cần set đầy đủ khi insert.
     * Với hệ thống hiện tại, `code` đang đồng nhất với `name` (ví dụ: USER_ROLE).
     */
    @NotBlank(message = "code is required")
    @Column(name = "code", nullable = false)
    private String code;
}

