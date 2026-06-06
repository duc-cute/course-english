package com.courseenglish.api.controller;

import com.courseenglish.api.config.StorageProperties;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Serve uploaded files at /storage/** (e.g. lessons/{lessonId}/{fileName}).
 * ResourceHandler alone can fail on Windows when the file: location has no trailing slash.
 */
@RestController
public class PublicStorageController {

    private final StorageProperties storageProperties;

    public PublicStorageController(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    @GetMapping("/storage/{*path}")
    public ResponseEntity<Resource> serve(@PathVariable("path") String path) throws IOException {
        String relative = path.startsWith("/") ? path.substring(1) : path;
        Path root = storageProperties.getRootPath();
        Path file = root.resolve(relative).normalize();
        if (!file.startsWith(root) || !Files.isRegularFile(file)) {
            return ResponseEntity.notFound().build();
        }
        String contentType = Files.probeContentType(file);
        MediaType mediaType = contentType != null
                ? MediaType.parseMediaType(contentType)
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .contentType(mediaType)
                .body(new FileSystemResource(file));
    }
}
