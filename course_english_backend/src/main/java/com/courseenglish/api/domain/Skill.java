package com.courseenglish.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "skills")
public class Skill extends BaseObject {

    @NotBlank(message = "Tên kĩ năng không được bỏ trống")
    private String name;
}
