package com.courseenglish.api.service.slide.impl;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.imageio.ImageIO;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;

import com.courseenglish.api.service.slide.PdfRenderService;

@Service
public class PdfRenderServiceImpl implements PdfRenderService {

    private static final int MAX_PAGES = 50;

    @Override
    public List<byte[]> renderPdfToPngPages(byte[] pdfBytes, int dpi) throws IOException {
        if (pdfBytes == null || pdfBytes.length == 0) {
            return List.of();
        }
        int safeDpi = Math.min(Math.max(dpi, 72), 300);
        List<byte[]> pages = new ArrayList<>();
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            int pageCount = document.getNumberOfPages();
            if (pageCount == 0) {
                return pages;
            }
            int limit = Math.min(pageCount, MAX_PAGES);
            PDFRenderer renderer = new PDFRenderer(document);
            for (int page = 0; page < limit; page++) {
                BufferedImage image = renderer.renderImageWithDPI(page, safeDpi, ImageType.RGB);
                try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                    ImageIO.write(image, "png", out);
                    pages.add(out.toByteArray());
                }
            }
        }
        return pages;
    }
}
