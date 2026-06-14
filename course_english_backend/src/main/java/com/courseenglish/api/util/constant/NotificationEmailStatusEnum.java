package com.courseenglish.api.util.constant;

import lombok.Getter;

@Getter
public enum NotificationEmailStatusEnum {
    SENT("SENT"),
    FAILED("FAILED");

    private final String value;

    NotificationEmailStatusEnum(String value) {
        this.value = value;
    }
}
