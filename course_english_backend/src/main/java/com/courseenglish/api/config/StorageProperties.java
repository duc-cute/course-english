package com.courseenglish.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.Paths;

@Component
@ConfigurationProperties(prefix = "storage")
public class StorageProperties {
    private String location;
    private String maxFileSize;

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getMaxFileSize() {
        return maxFileSize;
    }

    public void setMaxFileSize(String maxFileSize) {
        this.maxFileSize = maxFileSize;
    }

    public Path getRootPath() {
        return Paths.get(this.location).toAbsolutePath().normalize();
    }

    /** file: URI with trailing slash — required for Spring ResourceHandler path join. */
    public String getResourceLocation() {
        String uri = getRootPath().toUri().toString();
        return uri.endsWith("/") ? uri : uri + "/";
    }
}
