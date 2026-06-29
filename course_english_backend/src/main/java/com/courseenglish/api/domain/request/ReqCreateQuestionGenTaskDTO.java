package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.QuestionTypeEnum;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
public class ReqCreateQuestionGenTaskDTO {

  /** Required for document-based generation; omitted when {@link #topic} is set. */
  private UUID documentId;

  private UUID categoryId;

  @Min(1)
  @Max(50)
  private int questionCount = 10;

  private List<QuestionTypeEnum> questionTypes;

  /** Exact count per question type, e.g. MULTIPLE_CHOICE=10, READING_COMPREHENSION=3. */
  private Map<QuestionTypeEnum, Integer> typeQuotas;

  /** Topic-based generation — creates a synthetic brief instead of requiring upload. */
  @Size(max = 500)
  private String topic;

  @Min(1)
  @Max(12)
  private Integer grade;

  @Size(max = 32)
  private String languageLevel;

  @Size(max = 2000)
  private String additionalInstructions;

  /** Sub-questions per reading passage (default 4). */
  @Min(2)
  @Max(12)
  private Integer readingSubQuestionCount = 4;

  @Min(1)
  @Max(5)
  private Integer difficulty = 2;

  private String promptLang = "en";

  /** Optional per-type user prompt override from Prompt Preview step. */
  private Map<QuestionTypeEnum, String> customUserPromptByType;

  private UUID conversationId;
}
