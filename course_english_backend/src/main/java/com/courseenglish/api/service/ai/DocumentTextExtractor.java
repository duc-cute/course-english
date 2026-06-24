package com.courseenglish.api.service.ai;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class DocumentTextExtractor {

  public record ExtractResult(String text, int pageCount) {
  }

  public ExtractResult extract(Path filePath, String mimeType, int maxPages) throws IOException {
    String normalizedMime = mimeType == null ? "" : mimeType.toLowerCase();
    String fileName = filePath.getFileName().toString().toLowerCase();

    if (normalizedMime.contains("pdf") || fileName.endsWith(".pdf")) {
      return extractPdf(filePath, maxPages);
    }
    if (normalizedMime.contains("wordprocessingml") || normalizedMime.contains("msword") || fileName.endsWith(".docx")) {
      return extractDocx(filePath);
    }
    throw new IOException("Chỉ hỗ trợ file PDF hoặc DOCX");
  }

  private ExtractResult extractPdf(Path filePath, int maxPages) throws IOException {
    try (PDDocument document = Loader.loadPDF(filePath.toFile())) {
      int totalPages = document.getNumberOfPages();
      int endPage = Math.min(Math.max(totalPages, 1), Math.max(maxPages, 1));
      PDFTextStripper stripper = new PDFTextStripper();
      stripper.setStartPage(1);
      stripper.setEndPage(endPage);
      String text = stripper.getText(document);
      return new ExtractResult(text == null ? "" : text.trim(), totalPages);
    }
  }

  private ExtractResult extractDocx(Path filePath) throws IOException {
    StringBuilder builder = new StringBuilder();
    try (InputStream in = Files.newInputStream(filePath);
        XWPFDocument document = new XWPFDocument(in)) {
      for (XWPFParagraph paragraph : document.getParagraphs()) {
        String line = paragraph.getText();
        if (line != null && !line.isBlank()) {
          builder.append(line.trim()).append('\n');
        }
      }
    }
    return new ExtractResult(builder.toString().trim(), 1);
  }
}
