package com.courseenglish.api.service.slide.impl;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.courseenglish.api.domain.Lesson;
import com.courseenglish.api.domain.LessonAsset;
import com.courseenglish.api.domain.LessonBlock;
import com.courseenglish.api.domain.response.ResLessonAssetDTO;
import com.courseenglish.api.domain.response.ResLessonSlideImportDTO;
import com.courseenglish.api.repository.LessonAssetRepository;
import com.courseenglish.api.repository.LessonBlockRepository;
import com.courseenglish.api.repository.LessonRepository;
import com.courseenglish.api.service.FileService;
import com.courseenglish.api.service.cache.lesson.LessonCacheEvictor;
import com.courseenglish.api.service.slide.LessonSlideImportService;
import com.courseenglish.api.service.slide.PdfRenderService;
import com.courseenglish.api.util.constant.LessonAssetTypeEnum;
import com.courseenglish.api.util.constant.LessonBlockTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Service
public class LessonSlideImportServiceImpl implements LessonSlideImportService {

    private static final long MAX_ZIP_BYTES = 50L * 1024 * 1024;
    private static final int MAX_PDF_FILES = 100;
    private static final int RENDER_DPI = 150;

    private final LessonRepository lessonRepository;
    private final LessonBlockRepository lessonBlockRepository;
    private final LessonAssetRepository lessonAssetRepository;
    private final FileService fileService;
    private final PdfRenderService pdfRenderService;
    private final LessonCacheEvictor lessonCacheEvictor;
    private final ObjectMapper objectMapper;

    public LessonSlideImportServiceImpl(
            LessonRepository lessonRepository,
            LessonBlockRepository lessonBlockRepository,
            LessonAssetRepository lessonAssetRepository,
            FileService fileService,
            PdfRenderService pdfRenderService,
            LessonCacheEvictor lessonCacheEvictor,
            ObjectMapper objectMapper) {
        this.lessonRepository = lessonRepository;
        this.lessonBlockRepository = lessonBlockRepository;
        this.lessonAssetRepository = lessonAssetRepository;
        this.fileService = fileService;
        this.pdfRenderService = pdfRenderService;
        this.lessonCacheEvictor = lessonCacheEvictor;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public ResLessonSlideImportDTO importFromZip(UUID lessonId, MultipartFile zipFile, String title, String displayMode)
            throws IdInvalidException, IOException {
        Lesson lesson = lessonRepository.findByIdAndVoidedFalse(lessonId)
                .orElseThrow(() -> new IdInvalidException("Lesson không tồn tại!"));

        validateZipFile(zipFile);
        Map<String, byte[]> pdfEntries = extractPdfEntries(zipFile.getBytes());
        if (pdfEntries.isEmpty()) {
            throw new IdInvalidException("ZIP không chứa file PDF nào.");
        }
        if (pdfEntries.size() > MAX_PDF_FILES) {
            throw new IdInvalidException("ZIP có quá nhiều file PDF (tối đa " + MAX_PDF_FILES + ").");
        }

        String batchId = UUID.randomUUID().toString();
        String storageFolder = "lessons/" + lessonId + "/slides/" + batchId;
        fileService.createDirectory(storageFolder);

        List<ResLessonAssetDTO> assetDtos = new ArrayList<>();
        ArrayNode slidesNode = objectMapper.createArrayNode();
        int slideOrder = 0;
        int pdfCount = 0;

        for (Map.Entry<String, byte[]> entry : pdfEntries.entrySet()) {
            String pdfName = entry.getKey();
            byte[] pdfBytes = entry.getValue();
            List<byte[]> pages = pdfRenderService.renderPdfToPngPages(pdfBytes, RENDER_DPI);
            if (pages.isEmpty()) {
                continue;
            }
            pdfCount++;
            for (byte[] pngBytes : pages) {
                slideOrder++;
                String fileName = String.format("slide-%03d.png", slideOrder);
                String caption = entry.getKey();
                int slash = caption.lastIndexOf('/');
                if (slash >= 0) {
                    caption = caption.substring(slash + 1);
                }
                fileService.storeBytes(pngBytes, storageFolder, fileName);
                String publicUrl = "/storage/" + storageFolder + "/" + fileName;

                LessonAsset asset = new LessonAsset();
                asset.setLesson(lesson);
                asset.setType(LessonAssetTypeEnum.IMAGE);
                asset.setUrl(publicUrl);
                asset.setCaption(caption);
                asset.setDisplayOrder(slideOrder);
                LessonAsset savedAsset = lessonAssetRepository.save(asset);

                ResLessonAssetDTO assetDto = toAssetDto(savedAsset);
                assetDtos.add(assetDto);

                ObjectNode slideNode = objectMapper.createObjectNode();
                slideNode.put("assetId", savedAsset.getId().toString());
                slideNode.put("order", slideOrder);
                slideNode.put("caption", caption);
                slidesNode.add(slideNode);
            }
        }

        if (slideOrder == 0) {
            throw new IdInvalidException("Không render được slide nào từ PDF trong ZIP.");
        }

        String deckTitle = normalizeTitle(title, zipFile.getOriginalFilename());
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("title", deckTitle);
        payload.put("aspectRatio", "16:9");
        payload.put("displayMode", normalizeDisplayMode(displayMode));
        payload.set("slides", slidesNode);
        ObjectNode source = objectMapper.createObjectNode();
        source.put("type", "PDF_ZIP");
        source.put("originalFileName", safeFileName(zipFile.getOriginalFilename()));
        source.put("pdfCount", pdfCount);
        source.put("slideCount", slideOrder);
        payload.set("source", source);

        int nextOrder = (int) lessonBlockRepository.countByLesson_IdAndVoidedFalse(lessonId) + 1;
        LessonBlock block = new LessonBlock();
        block.setLesson(lesson);
        block.setBlockType(LessonBlockTypeEnum.SLIDE_DECK);
        block.setDisplayOrder(nextOrder);
        block.setPayloadJson(objectMapper.writeValueAsString(payload));
        LessonBlock savedBlock = lessonBlockRepository.save(block);

        lessonCacheEvictor.evictForLesson(lessonId);

        ResLessonSlideImportDTO result = new ResLessonSlideImportDTO();
        result.setBlockId(savedBlock.getId());
        result.setSlideCount(slideOrder);
        result.setPdfCount(pdfCount);
        result.setTitle(deckTitle);
        result.setAssets(assetDtos);
        return result;
    }

    private void validateZipFile(MultipartFile zipFile) throws IdInvalidException {
        if (zipFile == null || zipFile.isEmpty()) {
            throw new IdInvalidException("File ZIP trống.");
        }
        if (zipFile.getSize() > MAX_ZIP_BYTES) {
            throw new IdInvalidException("File ZIP quá lớn (tối đa 50MB).");
        }
        String name = zipFile.getOriginalFilename();
        if (name == null || !name.toLowerCase().endsWith(".zip")) {
            throw new IdInvalidException("Chỉ chấp nhận file .zip");
        }
    }

    private Map<String, byte[]> extractPdfEntries(byte[] zipBytes) throws IOException, IdInvalidException {
        Map<String, byte[]> pdfs = new LinkedHashMap<>();
        List<String> names = new ArrayList<>();

        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    continue;
                }
                String entryName = sanitizeZipEntryName(entry.getName());
                if (!entryName.toLowerCase().endsWith(".pdf")) {
                    continue;
                }
                byte[] content = zis.readAllBytes();
                if (content.length == 0) {
                    continue;
                }
                names.add(entryName);
                pdfs.put(entryName, content);
            }
        }

        names.sort(filenameComparator());
        Map<String, byte[]> sorted = new LinkedHashMap<>();
        for (String name : names) {
            sorted.put(name, pdfs.get(name));
        }
        return sorted;
    }

    private Comparator<String> filenameComparator() {
        return (a, b) -> {
            int cmp = extractNumericPrefix(a).compareTo(extractNumericPrefix(b));
            if (cmp != 0) {
                return cmp;
            }
            return a.compareToIgnoreCase(b);
        };
    }

    private String extractNumericPrefix(String name) {
        StringBuilder digits = new StringBuilder();
        for (int i = 0; i < name.length(); i++) {
            char ch = name.charAt(i);
            if (Character.isDigit(ch)) {
                digits.append(ch);
            } else if (digits.length() > 0) {
                break;
            }
        }
        if (digits.length() == 0) {
            return "999999:" + name.toLowerCase();
        }
        return String.format("%06d", Integer.parseInt(digits.toString())) + ":" + name.toLowerCase();
    }

    private String normalizeDisplayMode(String displayMode) {
        if (displayMode != null && "SCROLL".equalsIgnoreCase(displayMode.trim())) {
            return "SCROLL";
        }
        return "PRESENTATION";
    }

    private String sanitizeZipEntryName(String entryName) throws IdInvalidException {
        String normalized = entryName.replace('\\', '/');
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        if (normalized.contains("..")) {
            throw new IdInvalidException("ZIP entry path không hợp lệ: " + entryName);
        }
        return normalized;
    }

    private String normalizeTitle(String title, String zipFileName) {
        if (title != null && !title.isBlank()) {
            return title.trim();
        }
        String base = safeFileName(zipFileName);
        if (base.toLowerCase().endsWith(".zip")) {
            base = base.substring(0, base.length() - 4);
        }
        return base.isBlank() ? "Slide deck" : base;
    }

    private String safeFileName(String name) {
        if (name == null || name.isBlank()) {
            return "slides.zip";
        }
        return new String(name.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8);
    }

    private ResLessonAssetDTO toAssetDto(LessonAsset asset) {
        ResLessonAssetDTO dto = new ResLessonAssetDTO();
        dto.setId(asset.getId());
        dto.setLessonId(asset.getLesson() != null ? asset.getLesson().getId() : null);
        dto.setType(asset.getType());
        dto.setUrl(asset.getUrl());
        dto.setCaption(asset.getCaption());
        dto.setMetaJson(asset.getMetaJson());
        dto.setDisplayOrder(asset.getDisplayOrder());
        return dto;
    }
}
