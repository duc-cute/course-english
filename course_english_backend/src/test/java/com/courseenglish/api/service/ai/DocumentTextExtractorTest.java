package com.courseenglish.api.service.ai;

import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertTrue;

class DocumentTextExtractorTest {

  @TempDir
  Path tempDir;

  @Test
  void extractDocxPreservesBodyOrderWithTables() throws Exception {
    Path path = tempDir.resolve("exam.docx");
    try (XWPFDocument doc = new XWPFDocument()) {
      XWPFParagraph before = doc.createParagraph();
      before.createRun().setText("PART II instruction");

      XWPFTable table = doc.createTable(2, 2);
      table.getRow(0).getCell(0).setText("Question 11. The word relinquished");
      table.getRow(0).getCell(1).setText("A. made up");
      table.getRow(1).getCell(0).setText("B. given up");
      table.getRow(1).getCell(1).setText("C. taken over");

      XWPFParagraph after = doc.createParagraph();
      after.createRun().setText("Question 12 stem");

      try (OutputStream out = Files.newOutputStream(path)) {
        doc.write(out);
      }
    }

    DocumentTextExtractor extractor = new DocumentTextExtractor();
    String text =
        extractor
            .extract(path, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 100)
            .text();

    assertTrue(text.contains("PART II instruction"));
    assertTrue(text.contains("Question 11. The word relinquished"));
    assertTrue(text.contains("A. made up"));
    assertTrue(text.contains("B. given up"));
    assertTrue(text.contains("Question 12 stem"));
    assertTrue(text.contains("\t"), "table cells should be tab-separated");
    assertTrue(text.indexOf("PART II instruction") < text.indexOf("Question 11"));
    assertTrue(text.indexOf("C. taken over") < text.indexOf("Question 12 stem"));
  }
}
