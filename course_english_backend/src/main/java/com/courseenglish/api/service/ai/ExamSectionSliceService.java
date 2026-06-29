package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.request.ExamSectionGenSpecDTO;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ExamSectionSliceService {

  public static final int MIN_SLICE_CHARS = 80;
  public static final int MIN_SLICE_CHARS_HIGH = 200;
  public static final int READING_PAD_CHARS = 400;
  public static final int PREVIEW_MAX_CHARS = 480;

  private static final Pattern PART_HEADER =
      Pattern.compile(
          "^\\s*(?:PART|PHẦN|Phần)\\s+([IVXLC]+|\\d+|[A-Z])\\b",
          Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

  private static final Pattern PART_REF =
      Pattern.compile("(?i)(?:PART|PHẦN)\\s+([IVXLC]+|\\d+)");

  private static final Map<String, Integer> ROMAN_VALUES =
      Map.ofEntries(
          Map.entry("I", 1),
          Map.entry("II", 2),
          Map.entry("III", 3),
          Map.entry("IV", 4),
          Map.entry("V", 5),
          Map.entry("VI", 6),
          Map.entry("VII", 7),
          Map.entry("VIII", 8),
          Map.entry("IX", 9),
          Map.entry("X", 10));

  public enum SliceConfidence {
    HIGH,
    MEDIUM,
    LOW
  }

  public enum SliceMode {
    SLICED,
    FULL
  }

  public record PartMarker(int charOffset, int partNumber, String partLabel, String lineSnippet) {}

  /** Attach excerpt ranges + preview to each section spec. Mutates {@code sections} in place. */
  public void applySlices(String fullText, List<ExamSectionGenSpecDTO> sections, List<String> warnings) {
    if (fullText == null || fullText.isBlank() || sections == null || sections.isEmpty()) {
      return;
    }

    List<PartMarker> markers = findPartMarkers(fullText);
    if (markers.isEmpty()) {
      for (ExamSectionGenSpecDTO spec : sections) {
        assignFullDocument(spec, fullText, SliceConfidence.LOW);
      }
      if (sections.size() > 1) {
        warnings.add(
            "Không nhận diện PART I/II/III trong file — mỗi phần sẽ dùng toàn bộ đề khi sinh.");
      }
      return;
    }

    if (sections.size() == 1) {
      PartMarker marker = markers.get(0);
      int start = marker.charOffset();
      if (sections.get(0).getQuestionType() == QuestionTypeEnum.READING_COMPREHENSION
          || sections.get(0).getQuestionType() == QuestionTypeEnum.GAP_FILL_MCQ) {
        start = applyReadingPad(fullText, start, markers);
      }
      int end = fullText.length();
      assignSlice(sections.get(0), fullText, start, end, SliceConfidence.MEDIUM, marker);
      return;
    }

    for (int i = 0; i < sections.size(); i++) {
      ExamSectionGenSpecDTO spec = sections.get(i);
      if (Boolean.TRUE.equals(spec.getUseFullDocument())) {
        assignFullDocument(spec, fullText, SliceConfidence.HIGH, true);
        continue;
      }
      int markerIndex = resolveMarkerIndex(spec, i, markers, sections.size());
      if (markerIndex < 0) {
        assignFullDocument(spec, fullText, SliceConfidence.LOW);
        continue;
      }

      PartMarker marker = markers.get(markerIndex);
      int start = marker.charOffset();
      if (spec.getQuestionType() == QuestionTypeEnum.READING_COMPREHENSION) {
        start = applyReadingPad(fullText, start, markers);
      }
      if (spec.getQuestionType() == QuestionTypeEnum.GAP_FILL_MCQ) {
        start = applyReadingPad(fullText, start, markers);
      }
      int end = markerIndex + 1 < markers.size() ? markers.get(markerIndex + 1).charOffset() : fullText.length();
      SliceConfidence confidence = computeConfidence(spec, marker, markerIndex, i, markers, sections.size(), start, end);

      if (confidence == SliceConfidence.LOW || end - start < MIN_SLICE_CHARS) {
        assignFullDocument(spec, fullText, confidence);
        warnings.add(
            "Phần \""
                + safeTitle(spec)
                + "\" — không cắt được PART an toàn; sẽ dùng toàn bộ đề.");
      } else {
        assignSlice(spec, fullText, start, end, confidence, marker);
      }
    }
  }

  public String extractSectionText(String fullText, ExamSectionGenSpecDTO spec) {
    if (fullText == null || fullText.isBlank()) {
      return "";
    }
    if (Boolean.TRUE.equals(spec.getUseFullDocument())) {
      return fullText;
    }
    if (SliceMode.SLICED.name().equals(spec.getSliceMode())
        && spec.getExcerptStart() != null
        && spec.getExcerptEnd() != null) {
      String sliced = substring(fullText, spec.getExcerptStart(), spec.getExcerptEnd());
      if (sliced.length() >= MIN_SLICE_CHARS) {
        return sliced;
      }
    }
    return fullText;
  }

  public String substring(String fullText, int start, int end) {
    int safeStart = Math.max(0, Math.min(start, fullText.length()));
    int safeEnd = Math.max(safeStart, Math.min(end, fullText.length()));
    return fullText.substring(safeStart, safeEnd).trim();
  }

  List<PartMarker> findPartMarkers(String text) {
    List<PartMarker> markers = new ArrayList<>();
    String[] lines = text.split("\n", -1);
    int offset = 0;
    for (String line : lines) {
      Matcher matcher = PART_HEADER.matcher(line);
      if (matcher.find()) {
        String label = matcher.group(1).toUpperCase(Locale.ROOT);
        int partNumber = partLabelToNumber(label);
        markers.add(new PartMarker(offset, partNumber, label, trimSnippet(line, 96)));
      }
      offset += line.length() + 1;
    }
    return dedupeMarkers(markers);
  }

  private List<PartMarker> dedupeMarkers(List<PartMarker> markers) {
    Map<Integer, PartMarker> byOffset = new LinkedHashMap<>();
    for (PartMarker marker : markers) {
      byOffset.putIfAbsent(marker.charOffset(), marker);
    }
    return new ArrayList<>(byOffset.values());
  }

  private int resolveMarkerIndex(
      ExamSectionGenSpecDTO spec, int sectionIndex, List<PartMarker> markers, int sectionCount) {
    Integer titlePart = extractPartNumberFromSpec(spec);
    if (titlePart != null) {
      for (int i = 0; i < markers.size(); i++) {
        if (markers.get(i).partNumber() == titlePart) {
          return i;
        }
      }
    }
    if (sectionCount == markers.size() && sectionIndex < markers.size()) {
      return sectionIndex;
    }
    if (sectionIndex < markers.size()) {
      return sectionIndex;
    }
    return -1;
  }

  private SliceConfidence computeConfidence(
      ExamSectionGenSpecDTO spec,
      PartMarker marker,
      int markerIndex,
      int sectionIndex,
      List<PartMarker> markers,
      int sectionCount,
      int start,
      int end) {
    int length = end - start;
    if (length < MIN_SLICE_CHARS) {
      return SliceConfidence.LOW;
    }
    Integer titlePart = extractPartNumberFromSpec(spec);
    if (titlePart != null && titlePart == marker.partNumber()) {
      return length >= MIN_SLICE_CHARS_HIGH ? SliceConfidence.HIGH : SliceConfidence.MEDIUM;
    }
    if (sectionCount == markers.size() && sectionIndex == markerIndex) {
      return SliceConfidence.MEDIUM;
    }
    if (sectionIndex < markers.size() && sectionIndex == markerIndex) {
      return SliceConfidence.MEDIUM;
    }
    return SliceConfidence.LOW;
  }

  private int applyReadingPad(String fullText, int markerStart, List<PartMarker> markers) {
    int padStart = Math.max(0, markerStart - READING_PAD_CHARS);
    int prevMarkerEnd = 0;
    for (PartMarker marker : markers) {
      if (marker.charOffset() >= markerStart) {
        break;
      }
      prevMarkerEnd = marker.charOffset();
    }
    return Math.max(prevMarkerEnd, padStart);
  }

  private void assignSlice(
      ExamSectionGenSpecDTO spec,
      String fullText,
      int start,
      int end,
      SliceConfidence confidence,
      PartMarker marker) {
    spec.setExcerptStart(start);
    spec.setExcerptEnd(end);
    spec.setSliceMode(SliceMode.SLICED.name());
    spec.setSliceConfidence(confidence.name());
    spec.setSliceMarkerLabel(marker.partLabel());
    spec.setExcerptPreview(buildPreview(fullText, start, end));
    if (spec.getUseFullDocument() == null) {
      spec.setUseFullDocument(false);
    }
  }

  private void assignFullDocument(ExamSectionGenSpecDTO spec, String fullText, SliceConfidence confidence) {
    assignFullDocument(spec, fullText, confidence, false);
  }

  private void assignFullDocument(
      ExamSectionGenSpecDTO spec, String fullText, SliceConfidence confidence, boolean userForced) {
    spec.setExcerptStart(0);
    spec.setExcerptEnd(fullText.length());
    spec.setSliceMode(SliceMode.FULL.name());
    spec.setSliceConfidence(confidence.name());
    spec.setSliceMarkerLabel(null);
    spec.setExcerptPreview(buildPreview(fullText, 0, fullText.length()));
    spec.setUseFullDocument(userForced);
  }

  private String buildPreview(String fullText, int start, int end) {
    String slice = substring(fullText, start, end);
    if (slice.length() <= PREVIEW_MAX_CHARS) {
      return slice;
    }
    return slice.substring(0, PREVIEW_MAX_CHARS) + "\n…(còn " + (slice.length() - PREVIEW_MAX_CHARS) + " ký tự)";
  }

  private Integer extractPartNumberFromSpec(ExamSectionGenSpecDTO spec) {
    String haystack =
        ((spec.getTitle() != null ? spec.getTitle() : "")
                + " "
                + (spec.getInstruction() != null ? spec.getInstruction() : ""))
            .trim();
    if (haystack.isEmpty()) {
      return null;
    }
    Matcher matcher = PART_REF.matcher(haystack);
    if (!matcher.find()) {
      return null;
    }
    return partLabelToNumber(matcher.group(1).toUpperCase(Locale.ROOT));
  }

  private int partLabelToNumber(String label) {
    if (label == null || label.isBlank()) {
      return -1;
    }
    String normalized = label.trim().toUpperCase(Locale.ROOT);
    if (normalized.matches("\\d+")) {
      return Integer.parseInt(normalized);
    }
    return ROMAN_VALUES.getOrDefault(normalized, -1);
  }

  private static String trimSnippet(String line, int max) {
    String trimmed = line.trim();
    if (trimmed.length() <= max) {
      return trimmed;
    }
    return trimmed.substring(0, max) + "…";
  }

  private static String safeTitle(ExamSectionGenSpecDTO spec) {
    if (spec.getTitle() != null && !spec.getTitle().isBlank()) {
      return spec.getTitle().trim();
    }
    return "Phần " + (spec.getQuestionType() != null ? spec.getQuestionType().name() : "");
  }
}
