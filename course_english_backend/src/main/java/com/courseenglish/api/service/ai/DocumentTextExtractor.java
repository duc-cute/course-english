package com.courseenglish.api.service.ai;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.IBodyElement;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
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

  /**
   * Walks body elements in document order (paragraphs and tables interleaved).
   * Table rows are emitted one per line; cells in a row are tab-separated so MCQ
   * options in columns survive THPT Word layouts.
   */
  private ExtractResult extractDocx(Path filePath) throws IOException {
    StringBuilder builder = new StringBuilder();
    try (InputStream in = Files.newInputStream(filePath);
        XWPFDocument document = new XWPFDocument(in)) {
      for (IBodyElement element : document.getBodyElements()) {
        if (element instanceof XWPFParagraph paragraph) {
          appendParagraph(builder, paragraph);
        } else if (element instanceof XWPFTable table) {
          appendTable(builder, table);
        }
      }
    }
    return new ExtractResult(builder.toString().trim(), 1);
  }

  private static void appendParagraph(StringBuilder builder, XWPFParagraph paragraph) {
    String line = normalizeInlineText(paragraph.getText());
    if (!line.isEmpty()) {
      builder.append(line).append('\n');
    }
  }

  private static void appendTable(StringBuilder builder, XWPFTable table) {
    boolean wroteRow = false;
    for (XWPFTableRow row : table.getRows()) {
      String rowLine = formatTableRow(row);
      if (!rowLine.isEmpty()) {
        builder.append(rowLine).append('\n');
        wroteRow = true;
      }
    }
    if (wroteRow) {
      builder.append('\n');
    }
  }

  private static String formatTableRow(XWPFTableRow row) {
    StringBuilder rowLine = new StringBuilder();
    for (XWPFTableCell cell : row.getTableCells()) {
      String cellText = extractCellText(cell);
      if (cellText.isEmpty()) {
        continue;
      }
      if (rowLine.length() > 0) {
        rowLine.append('\t');
      }
      rowLine.append(cellText);
    }
    return rowLine.toString();
  }

  private static String extractCellText(XWPFTableCell cell) {
    StringBuilder cellBuilder = new StringBuilder();
    for (IBodyElement element : cell.getBodyElements()) {
      if (element instanceof XWPFParagraph paragraph) {
        appendInlineFragment(cellBuilder, normalizeInlineText(paragraph.getText()));
      } else if (element instanceof XWPFTable nested) {
        appendInlineFragment(cellBuilder, formatTableBlock(nested));
      }
    }
    return cellBuilder.toString().trim();
  }

  private static String formatTableBlock(XWPFTable table) {
    StringBuilder block = new StringBuilder();
    for (XWPFTableRow row : table.getRows()) {
      String rowLine = formatTableRow(row);
      if (!rowLine.isEmpty()) {
        if (block.length() > 0) {
          block.append('\n');
        }
        block.append(rowLine);
      }
    }
    return block.toString();
  }

  private static void appendInlineFragment(StringBuilder target, String fragment) {
    if (fragment == null || fragment.isEmpty()) {
      return;
    }
    if (target.length() > 0) {
      target.append(' ');
    }
    target.append(fragment);
  }

  private static String normalizeInlineText(String raw) {
    if (raw == null) {
      return "";
    }
    return raw.replace('\r', ' ').replace('\n', ' ').replaceAll("\\s+", " ").trim();
  }
}
