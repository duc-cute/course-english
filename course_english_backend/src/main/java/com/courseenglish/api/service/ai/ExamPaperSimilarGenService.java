package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.AiDocument;
import com.courseenglish.api.domain.request.ExamSectionGenSpecDTO;
import com.courseenglish.api.domain.request.ReqCreateExamPaperGenTaskDTO;
import com.courseenglish.api.domain.request.ReqCreateSimilarExamPaperGenTaskDTO;
import com.courseenglish.api.domain.response.ResCreateAiTaskDTO;
import com.courseenglish.api.domain.response.ResExamPaperDTO;
import com.courseenglish.api.domain.response.ResExamSectionDTO;
import com.courseenglish.api.service.ExamPaperService;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ExamPaperSimilarGenService {

  public static final String GENERATION_MODE_SIMILAR = "SIMILAR";

  private final ExamPaperService examPaperService;
  private final ExamPaperReferenceExcerptBuilder referenceExcerptBuilder;
  private final AiDocumentService aiDocumentService;
  private final AiTaskCommandService aiTaskCommandService;
  private final AiAccessSupport aiAccessSupport;

  public ExamPaperSimilarGenService(
      ExamPaperService examPaperService,
      ExamPaperReferenceExcerptBuilder referenceExcerptBuilder,
      AiDocumentService aiDocumentService,
      AiTaskCommandService aiTaskCommandService,
      AiAccessSupport aiAccessSupport) {
    this.examPaperService = examPaperService;
    this.referenceExcerptBuilder = referenceExcerptBuilder;
    this.aiDocumentService = aiDocumentService;
    this.aiTaskCommandService = aiTaskCommandService;
    this.aiAccessSupport = aiAccessSupport;
  }

  @Transactional
  public ResCreateAiTaskDTO createSimilarGenerationTask(
      UUID sourceExamPaperId, ReqCreateSimilarExamPaperGenTaskDTO request) throws IdInvalidException {
    aiAccessSupport.requireAiEnabled();
    aiAccessSupport.requireStaffUser();
    UUID userId = aiAccessSupport.currentUserId();

    ResExamPaperDTO source = examPaperService.getById(sourceExamPaperId);
    List<ResExamSectionDTO> sections = source.getSections();
    if (sections == null || sections.isEmpty()) {
      throw new IdInvalidException("Đề nguồn chưa có section nào");
    }

    List<ExamSectionGenSpecDTO> specs = new ArrayList<>();
    List<String> warnings = new ArrayList<>();
    int totalQuestions = 0;

    for (int i = 0; i < sections.size(); i++) {
      ResExamSectionDTO section = sections.get(i);
      QuestionTypeEnum type = section.getQuestionType();
      if (type == null) {
        throw new IdInvalidException("Section " + (i + 1) + " thiếu questionType");
      }
      int questionCount =
          referenceExcerptBuilder.resolveGenQuestionCount(type, section.getPayloadJson());
      if (questionCount < 1) {
        throw new IdInvalidException(
            "Section \""
                + (section.getTitle() != null ? section.getTitle() : "Phần " + (i + 1))
                + "\" chưa có câu hỏi — cần nội dung trước khi sinh đề tương tự");
      }
      String referenceExcerpt;
      try {
        referenceExcerpt = referenceExcerptBuilder.buildReferenceExcerpt(section);
      } catch (IllegalArgumentException ex) {
        throw new IdInvalidException(ex.getMessage());
      }

      ExamSectionGenSpecDTO spec = new ExamSectionGenSpecDTO();
      spec.setTitle(section.getTitle());
      spec.setInstruction(section.getInstruction());
      spec.setQuestionType(type);
      spec.setQuestionCount(questionCount);
      if (type == QuestionTypeEnum.READING_COMPREHENSION) {
        ExamPaperReferenceExcerptBuilder.ReadingGenCounts readingCounts =
            referenceExcerptBuilder.resolveReadingCounts(section.getPayloadJson());
        if (readingCounts.passageCount() > 1) {
          spec.setQuestionCount(readingCounts.passageCount());
          spec.setReadingSubQuestionCount(readingCounts.subQuestionCount());
        }
      } else if (type == QuestionTypeEnum.GAP_FILL_MCQ) {
        spec.setReadingSubQuestionCount(questionCount);
      }
      spec.setReferenceExcerpt(referenceExcerpt);
      spec.setUseFullDocument(true);
      spec.setSliceMode("FULL");
      spec.setExcerptPreview(truncatePreview(referenceExcerpt));
      specs.add(spec);
      totalQuestions += questionCount;
    }

    if (totalQuestions < 1) {
      throw new IdInvalidException("Đề nguồn không có câu hỏi để làm mẫu");
    }

    AiDocument stubDoc =
        aiDocumentService.createSimilarExamStubDocument(
            userId, sourceExamPaperId, source.getTitle(), sections.size(), totalQuestions);

    String newTitle =
        request.getNewExamTitle() != null && !request.getNewExamTitle().isBlank()
            ? request.getNewExamTitle().trim()
            : "Đề tương tự: " + source.getTitle();
    String newInstruction =
        request.getNewPaperInstruction() != null && !request.getNewPaperInstruction().isBlank()
            ? request.getNewPaperInstruction().trim()
            : source.getInstruction();

    ReqCreateExamPaperGenTaskDTO taskRequest = new ReqCreateExamPaperGenTaskDTO();
    taskRequest.setDocumentId(stubDoc.getId());
    taskRequest.setSectionSpecs(specs);
    taskRequest.setExamTitle(newTitle);
    taskRequest.setPaperInstruction(newInstruction);
    taskRequest.setDifficulty(request.getDifficulty() != null ? request.getDifficulty() : 2);
    taskRequest.setPromptLang(request.getPromptLang() != null ? request.getPromptLang() : "en");
    taskRequest.setGenerationMode(GENERATION_MODE_SIMILAR);
    taskRequest.setSourceExamPaperId(sourceExamPaperId);

    ResCreateAiTaskDTO created = aiTaskCommandService.createExamPaperGenerationTask(taskRequest);
    if (!warnings.isEmpty()) {
      // reserved for future soft warnings on response DTO
    }
    return created;
  }

  private static String truncatePreview(String text) {
    if (text == null) {
      return "";
    }
    String normalized = text.replace('\r', ' ').replace('\n', ' ').trim();
    if (normalized.length() <= 480) {
      return normalized;
    }
    return normalized.substring(0, 480) + "…";
  }
}
