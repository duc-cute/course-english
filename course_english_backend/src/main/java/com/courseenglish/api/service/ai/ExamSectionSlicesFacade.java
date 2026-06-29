package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.AiDocument;
import com.courseenglish.api.domain.request.ExamSectionGenSpecDTO;
import com.courseenglish.api.domain.request.ReqExamSectionSlicesDTO;
import com.courseenglish.api.domain.response.ResExamSectionSlicesDTO;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ExamSectionSlicesFacade {

  private final AiDocumentService aiDocumentService;
  private final AiAccessSupport aiAccessSupport;
  private final ExamSectionSliceService examSectionSliceService;

  public ExamSectionSlicesFacade(
      AiDocumentService aiDocumentService,
      AiAccessSupport aiAccessSupport,
      ExamSectionSliceService examSectionSliceService) {
    this.aiDocumentService = aiDocumentService;
    this.aiAccessSupport = aiAccessSupport;
    this.examSectionSliceService = examSectionSliceService;
  }

  public ResExamSectionSlicesDTO recalculate(ReqExamSectionSlicesDTO request) throws IdInvalidException {
    aiAccessSupport.requireAiEnabled();
    aiAccessSupport.requireStaffUser();
    UUID userId = aiAccessSupport.currentUserId();

    AiDocument document =
        aiDocumentService.requireReadyDocument(request.getDocumentId(), userId);
    String text = document.getExtractedText();
    if (text == null || text.isBlank()) {
      throw new IdInvalidException("Tài liệu không có nội dung");
    }

    List<ExamSectionGenSpecDTO> sections = new ArrayList<>(request.getSections());
    List<String> warnings = new ArrayList<>();
    examSectionSliceService.applySlices(text, sections, warnings);

    ResExamSectionSlicesDTO response = new ResExamSectionSlicesDTO();
    response.setSections(sections);
    response.setWarnings(warnings);
    return response;
  }
}
