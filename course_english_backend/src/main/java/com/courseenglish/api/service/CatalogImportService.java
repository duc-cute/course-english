package com.courseenglish.api.service;

import java.io.IOException;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import com.courseenglish.api.domain.response.ResCatalogImportResultDTO;
import com.courseenglish.api.util.catalogimport.CatalogImportType;

public interface CatalogImportService {

    Resource buildTemplate(CatalogImportType type) throws IOException;

    ResCatalogImportResultDTO importFile(CatalogImportType type, MultipartFile file) throws IOException;
}
