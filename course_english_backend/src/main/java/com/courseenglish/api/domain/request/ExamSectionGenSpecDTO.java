package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.QuestionTypeEnum;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExamSectionGenSpecDTO {

  @Size(max = 200)
  private String title;

  @Size(max = 4000)
  private String instruction;

  @NotNull
  private QuestionTypeEnum questionType;

  @Min(1)
  @Max(50)
  private int questionCount = 5;

  /** Inclusive start offset in extracted document text (Phase 6.8 slice). */
  private Integer excerptStart;

  /** Exclusive end offset in extracted document text. */
  private Integer excerptEnd;

  /** SLICED = per-PART excerpt; FULL = entire document. */
  @Size(max = 16)
  private String sliceMode;

  /** HIGH | MEDIUM | LOW — confidence of PART boundary match. */
  @Size(max = 16)
  private String sliceConfidence;

  /** PART label matched in source, e.g. II */
  @Size(max = 16)
  private String sliceMarkerLabel;

  /** Truncated excerpt for admin preview (~480 chars). */
  @Size(max = 600)
  private String excerptPreview;

  /** When true, generation ignores slice and uses full document. */
  private Boolean useFullDocument;
}
