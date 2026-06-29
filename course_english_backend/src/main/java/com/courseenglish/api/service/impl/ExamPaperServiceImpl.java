package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.ExamPaper;
import com.courseenglish.api.domain.ExamSection;
import com.courseenglish.api.domain.Subject;
import com.courseenglish.api.domain.request.ReqExamPaperDTO;
import com.courseenglish.api.domain.request.ReqExamSectionDTO;
import com.courseenglish.api.domain.request.ReqReorderExamSectionsDTO;
import com.courseenglish.api.domain.request.ReqSearchExamPaperDTO;
import com.courseenglish.api.domain.response.ResExamPaperDTO;
import com.courseenglish.api.domain.response.ResExamSectionDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.ExamPaperRepository;
import com.courseenglish.api.repository.ExamSectionRepository;
import com.courseenglish.api.repository.SubjectRepository;
import com.courseenglish.api.service.ExamPaperService;
import com.courseenglish.api.service.ExamSectionPayloadValidator;
import com.courseenglish.api.util.CatalogSearchSpecs;
import com.courseenglish.api.util.PagingSearchUtil;
import com.courseenglish.api.util.constant.ExamPaperStatusEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ExamPaperServiceImpl implements ExamPaperService {

    private final ExamPaperRepository examPaperRepository;
    private final ExamSectionRepository examSectionRepository;
    private final SubjectRepository subjectRepository;
    private final ExamSectionPayloadValidator payloadValidator;

    public ExamPaperServiceImpl(
            ExamPaperRepository examPaperRepository,
            ExamSectionRepository examSectionRepository,
            SubjectRepository subjectRepository,
            ExamSectionPayloadValidator payloadValidator) {
        this.examPaperRepository = examPaperRepository;
        this.examSectionRepository = examSectionRepository;
        this.subjectRepository = subjectRepository;
        this.payloadValidator = payloadValidator;
    }

    @Override
    public ResultPaginationDTO search(ReqSearchExamPaperDTO req) {
        ReqSearchExamPaperDTO payload = req == null ? new ReqSearchExamPaperDTO() : req;
        Specification<ExamPaper> spec = CatalogSearchSpecs.examPaperSearch(payload);
        Pageable pageable = PagingSearchUtil.toPageable(payload);

        Specification<ExamPaper> notVoidedSpec = (root, query, cb) -> cb.isFalse(root.get("voided"));
        Specification<ExamPaper> finalSpec = spec == null ? notVoidedSpec : spec.and(notVoidedSpec);

        Page<ExamPaper> page = examPaperRepository.findAll(finalSpec, pageable);

        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setTotal(page.getTotalElements());
        meta.setPages(page.getTotalPages());

        ResultPaginationDTO dto = new ResultPaginationDTO();
        dto.setMeta(meta);
        dto.setResult(page.getContent().stream()
                .map(paper -> toDto(paper, false))
                .collect(Collectors.toList()));
        return dto;
    }

    @Override
    public ResExamPaperDTO getById(UUID id) throws IdInvalidException {
        ExamPaper paper = examPaperRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Đề thi không tồn tại"));
        return toDto(paper, true);
    }

    @Override
    @Transactional
    public ResExamPaperDTO create(ReqExamPaperDTO request) throws IdInvalidException {
        validateRequest(request);
        ExamPaper entity = new ExamPaper();
        applyFields(request, entity);
        ExamPaper saved = examPaperRepository.save(entity);
        saveSections(saved, request.getSections());
        validatePublished(saved.getId(), saved.getStatus());
        return toDto(saved, true);
    }

    @Override
    @Transactional
    public ResExamPaperDTO update(UUID id, ReqExamPaperDTO request) throws IdInvalidException {
        ExamPaper entity = examPaperRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Đề thi không tồn tại"));
        validateRequest(request);
        applyFields(request, entity);
        ExamPaper saved = examPaperRepository.save(entity);
        replaceSections(saved, request.getSections());
        validatePublished(saved.getId(), saved.getStatus());
        return toDto(saved, true);
    }

    @Override
    @Transactional
    public void delete(UUID id) throws IdInvalidException {
        ExamPaper entity = examPaperRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Đề thi không tồn tại"));
        entity.setVoided(true);
        examPaperRepository.save(entity);
        for (ExamSection section : examSectionRepository.findByExamPaper_IdAndVoidedFalse(id)) {
            section.setVoided(true);
            examSectionRepository.save(section);
        }
    }

    @Override
    @Transactional
    public ResExamPaperDTO reorderSections(UUID examPaperId, ReqReorderExamSectionsDTO request)
            throws IdInvalidException {
        ExamPaper paper = examPaperRepository.findByIdAndVoidedFalse(examPaperId)
                .orElseThrow(() -> new IdInvalidException("Đề thi không tồn tại"));
        if (request == null || request.getSectionIds() == null || request.getSectionIds().isEmpty()) {
            throw new IdInvalidException("sectionIds không hợp lệ");
        }

        List<ExamSection> existing = examSectionRepository
                .findByExamPaper_IdAndVoidedFalseOrderByDisplayOrderAsc(examPaperId);
        Map<UUID, ExamSection> byId = new HashMap<>();
        for (ExamSection section : existing) {
            byId.put(section.getId(), section);
        }

        if (request.getSectionIds().size() != existing.size()) {
            throw new IdInvalidException("sectionIds phải chứa đủ tất cả phần của đề");
        }

        Set<UUID> seen = new HashSet<>();
        int order = 0;
        for (UUID sectionId : request.getSectionIds()) {
            ExamSection section = byId.get(sectionId);
            if (section == null) {
                throw new IdInvalidException("Phần không thuộc đề: " + sectionId);
            }
            if (!seen.add(sectionId)) {
                throw new IdInvalidException("sectionIds bị trùng: " + sectionId);
            }
            section.setDisplayOrder(order++);
            examSectionRepository.save(section);
        }

        return toDto(paper, true);
    }

    private void validateRequest(ReqExamPaperDTO request) throws IdInvalidException {
        if (request == null || request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IdInvalidException("Tiêu đề đề thi không được để trống");
        }
        if (request.getPassScorePercent() != null) {
            int score = request.getPassScorePercent();
            if (score < 0 || score > 100) {
                throw new IdInvalidException("passScorePercent phải từ 0 đến 100");
            }
        }
        if (request.getDurationMinutes() != null && request.getDurationMinutes() < 1) {
            throw new IdInvalidException("durationMinutes phải >= 1");
        }
        if (request.getSections() != null) {
            for (ReqExamSectionDTO section : request.getSections()) {
                validateSectionDto(section);
            }
        }
    }

    private void validateSectionDto(ReqExamSectionDTO section) throws IdInvalidException {
        if (section == null) {
            throw new IdInvalidException("Section không hợp lệ");
        }
        payloadValidator.validatePayloadJson(section.getPayloadJson());
        payloadValidator.validateQuestionTypeConsistency(section.getQuestionType(), section.getPayloadJson());
    }

    private void validatePublished(UUID examPaperId, ExamPaperStatusEnum status) throws IdInvalidException {
        if (status != ExamPaperStatusEnum.PUBLISHED) {
            return;
        }
        List<ExamSection> sections = examSectionRepository
                .findByExamPaper_IdAndVoidedFalseOrderByDisplayOrderAsc(examPaperId);
        if (sections.isEmpty()) {
            throw new IdInvalidException("Không thể publish đề thi không có phần nào");
        }
        for (ExamSection section : sections) {
            if (payloadValidator.countQuestions(section.getPayloadJson()) < 1) {
                throw new IdInvalidException(
                        "Phần \"" + nullToEmpty(section.getTitle()) + "\" chưa có câu hỏi — không thể publish");
            }
        }
    }

    private void applyFields(ReqExamPaperDTO request, ExamPaper entity) throws IdInvalidException {
        entity.setTitle(request.getTitle().trim());
        entity.setInstruction(trimToNull(request.getInstruction()));
        entity.setDurationMinutes(request.getDurationMinutes());
        if (request.getPassScorePercent() != null) {
            entity.setPassScorePercent(request.getPassScorePercent());
        }
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }
        if (request.getSubjectId() != null) {
            Subject subject = subjectRepository.findByIdAndVoidedFalse(request.getSubjectId())
                    .orElseThrow(() -> new IdInvalidException("Môn học không tồn tại"));
            entity.setSubject(subject);
        } else if (!entity.isVoided()) {
            entity.setSubject(null);
        }
    }

    private void saveSections(ExamPaper paper, List<ReqExamSectionDTO> sections) throws IdInvalidException {
        if (sections == null || sections.isEmpty()) {
            return;
        }
        int order = 0;
        for (ReqExamSectionDTO dto : sections) {
            ExamSection section = new ExamSection();
            section.setExamPaper(paper);
            applySectionFields(dto, section, order++);
            examSectionRepository.save(section);
        }
    }

    private void replaceSections(ExamPaper paper, List<ReqExamSectionDTO> sections) throws IdInvalidException {
        List<ExamSection> existing = examSectionRepository.findByExamPaper_IdAndVoidedFalse(paper.getId());
        Map<UUID, ExamSection> existingById = existing.stream()
                .collect(Collectors.toMap(ExamSection::getId, s -> s));

        Set<UUID> kept = new HashSet<>();
        List<ReqExamSectionDTO> incoming = sections == null ? List.of() : sections;

        int order = 0;
        for (ReqExamSectionDTO dto : incoming) {
            if (dto.getId() != null && existingById.containsKey(dto.getId())) {
                ExamSection section = existingById.get(dto.getId());
                applySectionFields(dto, section, order++);
                examSectionRepository.save(section);
                kept.add(section.getId());
            } else {
                ExamSection section = new ExamSection();
                section.setExamPaper(paper);
                applySectionFields(dto, section, order++);
                examSectionRepository.save(section);
                kept.add(section.getId());
            }
        }

        for (ExamSection section : existing) {
            if (!kept.contains(section.getId())) {
                section.setVoided(true);
                examSectionRepository.save(section);
            }
        }
    }

    private void applySectionFields(ReqExamSectionDTO dto, ExamSection section, int displayOrder)
            throws IdInvalidException {
        validateSectionDto(dto);
        section.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : displayOrder);
        section.setTitle(trimToNull(dto.getTitle()));
        section.setInstruction(trimToNull(dto.getInstruction()));
        section.setQuestionType(dto.getQuestionType());
        section.setPayloadJson(dto.getPayloadJson().trim());
    }

    private ResExamPaperDTO toDto(ExamPaper paper, boolean includeSections) {
        ResExamPaperDTO dto = new ResExamPaperDTO();
        dto.setId(paper.getId());
        dto.setTitle(paper.getTitle());
        dto.setInstruction(paper.getInstruction());
        dto.setDurationMinutes(paper.getDurationMinutes());
        dto.setPassScorePercent(paper.getPassScorePercent());
        dto.setStatus(paper.getStatus());
        dto.setCreatedAt(paper.getCreatedAt());
        dto.setUpdatedAt(paper.getUpdatedAt());

        if (paper.getSubject() != null) {
            dto.setSubjectId(paper.getSubject().getId());
            dto.setSubjectName(paper.getSubject().getName());
        }

        if (includeSections) {
            List<ExamSection> sections = examSectionRepository
                    .findByExamPaper_IdAndVoidedFalseOrderByDisplayOrderAsc(paper.getId());
            List<ResExamSectionDTO> sectionDtos = sections.stream()
                    .map(this::toSectionDto)
                    .collect(Collectors.toList());
            dto.setSections(sectionDtos);
            dto.setSectionCount(sectionDtos.size());
            dto.setQuestionCount(sectionDtos.stream().mapToInt(ResExamSectionDTO::getQuestionCount).sum());
        } else {
            List<ExamSection> sections = examSectionRepository
                    .findByExamPaper_IdAndVoidedFalseOrderByDisplayOrderAsc(paper.getId());
            dto.setSectionCount(sections.size());
            dto.setQuestionCount(sections.stream()
                    .mapToInt(s -> payloadValidator.countQuestions(s.getPayloadJson()))
                    .sum());
        }

        return dto;
    }

    private ResExamSectionDTO toSectionDto(ExamSection section) {
        ResExamSectionDTO dto = new ResExamSectionDTO();
        dto.setId(section.getId());
        dto.setExamPaperId(section.getExamPaper().getId());
        dto.setDisplayOrder(section.getDisplayOrder());
        dto.setTitle(section.getTitle());
        dto.setInstruction(section.getInstruction());
        dto.setQuestionType(section.getQuestionType());
        dto.setPayloadJson(section.getPayloadJson());
        dto.setQuestionCount(payloadValidator.countQuestions(section.getPayloadJson()));
        dto.setCreatedAt(section.getCreatedAt());
        dto.setUpdatedAt(section.getUpdatedAt());
        return dto;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
