package com.courseenglish.api.service.impl;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

import org.springframework.core.io.InputStreamResource;
import org.springframework.stereotype.Service;
import com.courseenglish.api.service.FileService;
import org.springframework.web.multipart.MultipartFile;
import com.courseenglish.api.config.StorageProperties;

@Service
public class FileServiceImpl implements FileService {
    private final StorageProperties storageProperties;

    public FileServiceImpl(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    public void createDirectory(String folder) throws IOException {
        Path folderPath = storageProperties.getRootPath().resolve(folder).normalize();
        Files.createDirectories(folderPath);
    }

    public String store(MultipartFile file, String folder) throws IOException {
        // create unique filename
        String finalName = System.currentTimeMillis() + "-" + file.getOriginalFilename();

        Path path = storageProperties.getRootPath()
                .resolve(folder)
                .resolve(finalName)
                .normalize();
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, path,
                    StandardCopyOption.REPLACE_EXISTING);
        }
        return finalName;
    }

    @Override
    public String storeBytes(byte[] content, String folder, String fileName) throws IOException {
        Path folderPath = storageProperties.getRootPath().resolve(folder).normalize();
        Files.createDirectories(folderPath);
        Path path = folderPath.resolve(fileName).normalize();
        if (!path.startsWith(folderPath)) {
            throw new IOException("Invalid file path");
        }
        Files.write(path, content);
        return fileName;
    }

    public long getFileLength(String fileName, String folder) {
        File tmpDir = storageProperties.getRootPath()
                .resolve(folder)
                .resolve(fileName)
                .normalize()
                .toFile();

        // file không tồn tại, hoặc file là 1 director => return 0
        if (!tmpDir.exists() || tmpDir.isDirectory())
            return 0;
        return tmpDir.length();
    }

    public InputStreamResource getResource(String fileName, String folder)
            throws FileNotFoundException {
        File file = storageProperties.getRootPath()
                .resolve(folder)
                .resolve(fileName)
                .normalize()
                .toFile();
        return new InputStreamResource(new FileInputStream(file));
    }

}
