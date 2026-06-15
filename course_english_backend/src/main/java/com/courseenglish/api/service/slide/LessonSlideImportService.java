package com.courseenglish.api.service.slide;

import java.io.IOException;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

import com.courseenglish.api.domain.response.ResLessonSlideImportDTO;
import com.courseenglish.api.util.error.IdInvalidException;

public interface LessonSlideImportService {

    ResLessonSlideImportDTO importFromZip(UUID lessonId, MultipartFile zipFile, String title, String displayMode)
            throws IdInvalidException, IOException;
}
