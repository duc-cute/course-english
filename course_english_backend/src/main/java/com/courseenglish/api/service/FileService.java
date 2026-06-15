package com.courseenglish.api.service;

import java.io.FileNotFoundException;
import java.io.IOException;

import org.springframework.core.io.InputStreamResource;
import org.springframework.web.multipart.MultipartFile;

public interface FileService {

    void createDirectory(String folder) throws IOException;

    String store(MultipartFile file, String folder) throws IOException;

    String storeBytes(byte[] content, String folder, String fileName) throws IOException;

    long getFileLength(String fileName, String folder);

    InputStreamResource getResource(String fileName, String folder) throws FileNotFoundException;
}
