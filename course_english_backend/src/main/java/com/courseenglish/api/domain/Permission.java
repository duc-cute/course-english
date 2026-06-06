package com.courseenglish.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "permissions")
@Getter
@Setter
public class Permission extends BaseObject {

    @NotBlank(message = "name is required")
    private String name;

    @NotBlank(message = "api path is required")
    private String apiPath;

    @NotBlank(message = "method is required")
    private String method;

    @NotBlank(message = "module is required")
    private String module;

    public Permission() {
    }

    public Permission(String name, String apiPath, String method, String module) {
        this.name = name;
        this.apiPath = apiPath;
        this.method = method;
        this.module = module;
    }
}
