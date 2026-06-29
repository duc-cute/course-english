package com.courseenglish.api.service.ai.question.dto;

import com.courseenglish.api.util.constant.QuestionTypeEnum;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class AiExamPaperGenSectionDTO {

  private String title;
  private String instruction;
  private QuestionTypeEnum questionType;
  private List<AiDraftQuestionDTO> questions = new ArrayList<>();
}
