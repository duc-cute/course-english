package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.request.ExamSectionGenSpecDTO;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ExamSectionSliceServiceTest {

  private final ExamSectionSliceService service = new ExamSectionSliceService();

  @Test
  void slicesMultiplePartsByTitle() {
    String text =
        """
            PART I — SYNONYMS
            Question 1. A
            Question 2. B

            PART II — READING
            Long passage about economics.
            Question 11. The word relinquished
            A. made up
            B. given up

            PART III — GRAMMAR
            Question 21. C
            """;

    List<ExamSectionGenSpecDTO> sections = new ArrayList<>();
    sections.add(partSpec("PART I — SYNONYMS", QuestionTypeEnum.MULTIPLE_CHOICE));
    sections.add(partSpec("PART II — READING", QuestionTypeEnum.READING_COMPREHENSION));
    sections.add(partSpec("PART III — GRAMMAR", QuestionTypeEnum.MULTIPLE_CHOICE));

    List<String> warnings = new ArrayList<>();
    service.applySlices(text, sections, warnings);

    ExamSectionGenSpecDTO part2 = sections.get(1);
    assertEquals(ExamSectionSliceService.SliceMode.SLICED.name(), part2.getSliceMode());
    assertTrue(part2.getExcerptStart() != null && part2.getExcerptEnd() != null);
    String slice = service.extractSectionText(text, part2);
    assertTrue(slice.contains("Long passage about economics"));
    assertTrue(slice.contains("Question 11"));
    assertTrue(slice.contains("A. made up"));
    assertTrue(!slice.contains("PART III"));
  }

  @Test
  void fallsBackToFullDocumentWhenNoPartHeaders() {
    String text = "Some exam without part headers.\nQuestion 1.\nQuestion 2.\n".repeat(20);
    List<ExamSectionGenSpecDTO> sections = new ArrayList<>();
    sections.add(partSpec("Section A", QuestionTypeEnum.MULTIPLE_CHOICE));
    sections.add(partSpec("Section B", QuestionTypeEnum.MULTIPLE_CHOICE));

    List<String> warnings = new ArrayList<>();
    service.applySlices(text, sections, warnings);

    assertEquals(ExamSectionSliceService.SliceMode.FULL.name(), sections.get(0).getSliceMode());
    assertTrue(!warnings.isEmpty());
    assertEquals(text, service.extractSectionText(text, sections.get(0)));
  }

  @Test
  void useFullDocumentOverrideIgnoresSlice() {
    String text =
        """
            PART I
            Alpha

            PART II
            Beta
            """;
    ExamSectionGenSpecDTO spec = partSpec("PART I", QuestionTypeEnum.MULTIPLE_CHOICE);
    service.applySlices(text, List.of(spec), new ArrayList<>());
    spec.setUseFullDocument(true);

    assertEquals(text.trim(), service.extractSectionText(text, spec).trim());
  }

  private static ExamSectionGenSpecDTO partSpec(String title, QuestionTypeEnum type) {
    ExamSectionGenSpecDTO spec = new ExamSectionGenSpecDTO();
    spec.setTitle(title);
    spec.setInstruction("Mark the letter A, B, C or D");
    spec.setQuestionType(type);
    spec.setQuestionCount(type == QuestionTypeEnum.READING_COMPREHENSION ? 4 : 5);
    return spec;
  }
}
