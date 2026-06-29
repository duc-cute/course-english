package com.courseenglish.api.domain.response;

import com.courseenglish.api.domain.request.ExamSectionGenSpecDTO;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ResExamPaperOutlineDTO {

  private String examTitle;
  private String paperInstruction;
  private List<ExamSectionGenSpecDTO> sections = new ArrayList<>();
  private List<String> warnings = new ArrayList<>();
}
