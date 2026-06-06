package com.courseenglish.api.controller;

import com.courseenglish.api.domain.response.ResCatalogImportResultDTO;
import com.courseenglish.api.service.CatalogImportService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.catalogimport.CatalogImportType;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/catalog-import")
public class CatalogImportController {
    private final CatalogImportService catalogImportService;

    public CatalogImportController(CatalogImportService catalogImportService) {
        this.catalogImportService = catalogImportService;
    }

    @GetMapping("/{type}/template")
    @ApiMessage("Download import template")
    public ResponseEntity<Resource> downloadTemplate(@PathVariable String type) throws IOException {
        CatalogImportType importType = CatalogImportType.fromPath(type);
        Resource resource = catalogImportService.buildTemplate(importType);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(resource);
    }

    @PostMapping(value = "/{type}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ApiMessage("Import catalog from Excel")
    public ResponseEntity<ResCatalogImportResultDTO> importExcel(
            @PathVariable String type,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        CatalogImportType importType = CatalogImportType.fromPath(type);
        ResCatalogImportResultDTO result = catalogImportService.importFile(importType, file);
        return ResponseEntity.ok(result);
    }
}
