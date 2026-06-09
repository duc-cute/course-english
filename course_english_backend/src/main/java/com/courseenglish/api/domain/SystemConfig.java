package com.courseenglish.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "system_configs")
@Getter
@Setter
public class SystemConfig extends BaseObject {

    @Column(name = "config_key", nullable = false, length = 128, unique = true)
    private String configKey;

    @Column(name = "config_value", columnDefinition = "TEXT")
    private String configValue;

    @Column(columnDefinition = "TEXT")
    private String note;
}
