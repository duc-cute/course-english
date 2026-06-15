package com.courseenglish.api.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.redis")
public class RedisProperties {

    private boolean enabled = false;
    private String host = "localhost";
    private int port = 6379;
    private String password = "";
    private int database = 0;
    private String keyPrefix = "ce:";
    private long lessonDetailTtlSeconds = 43_200;
    private long nullCacheTtlSeconds = 120;
    private long lockTtlSeconds = 10;
    /** 0.0–1.0 extra TTL randomization to reduce cache avalanche. */
    private double ttlJitterRatio = 0.2;
}
