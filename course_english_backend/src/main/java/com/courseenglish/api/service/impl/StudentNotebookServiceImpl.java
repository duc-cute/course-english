package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Story;
import com.courseenglish.api.domain.StudentNotebookEntry;
import com.courseenglish.api.domain.VocabularyWord;
import com.courseenglish.api.domain.request.ReqCreateNotebookEntryDTO;
import com.courseenglish.api.domain.request.ReqSearchNotebookEntryDTO;
import com.courseenglish.api.domain.response.ResNotebookEntryDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.StoryRepository;
import com.courseenglish.api.repository.StudentNotebookEntryRepository;
import com.courseenglish.api.repository.VocabularyWordRepository;
import com.courseenglish.api.service.StudentNotebookService;
import com.courseenglish.api.util.PagingSearchUtil;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.constant.NotebookReviewStatusEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StudentNotebookServiceImpl implements StudentNotebookService {

    private final StudentNotebookEntryRepository notebookRepository;
    private final VocabularyWordRepository vocabularyWordRepository;
    private final StoryRepository storyRepository;

    public StudentNotebookServiceImpl(
            StudentNotebookEntryRepository notebookRepository,
            VocabularyWordRepository vocabularyWordRepository,
            StoryRepository storyRepository) {
        this.notebookRepository = notebookRepository;
        this.vocabularyWordRepository = vocabularyWordRepository;
        this.storyRepository = storyRepository;
    }

    @Override
    public ResultPaginationDTO search(ReqSearchNotebookEntryDTO req) throws IdInvalidException {
        UUID studentId = requireCurrentStudentId();
        ReqSearchNotebookEntryDTO payload = req == null ? new ReqSearchNotebookEntryDTO() : req;
        Pageable pageable = PagingSearchUtil.toPageable(payload);

        Specification<StudentNotebookEntry> spec = (root, query, cb) -> {
            var predicates = new jakarta.persistence.criteria.Predicate[] {
                cb.isFalse(root.get("voided")),
                cb.equal(root.get("studentId"), studentId)
            };
            if (payload.getStoryId() != null) {
                predicates = java.util.Arrays.copyOf(predicates, predicates.length + 1);
                predicates[predicates.length - 1] = cb.equal(root.get("storyId"), payload.getStoryId());
            }
            return cb.and(predicates);
        };

        Page<StudentNotebookEntry> page = notebookRepository.findAll(spec, pageable);

        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setTotal(page.getTotalElements());
        meta.setPages(page.getTotalPages());

        ResultPaginationDTO dto = new ResultPaginationDTO();
        dto.setMeta(meta);
        dto.setResult(page.getContent().stream().map(this::toDto).collect(Collectors.toList()));
        return dto;
    }

    @Override
    @Transactional
    public ResNotebookEntryDTO save(ReqCreateNotebookEntryDTO request) throws IdInvalidException {
        UUID studentId = requireCurrentStudentId();

        VocabularyWord word = vocabularyWordRepository.findByIdAndVoidedFalse(request.getWordId())
                .orElseThrow(() -> new IdInvalidException("Từ vựng không tồn tại"));
        Story story = storyRepository.findByIdAndVoidedFalse(request.getStoryId())
                .orElseThrow(() -> new IdInvalidException("Story không tồn tại"));

        StudentNotebookEntry entry = notebookRepository
                .findByStudentIdAndWordIdAndStoryIdAndVoidedFalse(studentId, word.getId(), story.getId())
                .orElseGet(StudentNotebookEntry::new);

        entry.setStudentId(studentId);
        entry.setWordId(word.getId());
        entry.setStoryId(story.getId());
        entry.setContextSentence(request.getContextSentence());
        if (entry.getReviewStatus() == null) {
            entry.setReviewStatus(NotebookReviewStatusEnum.NEW);
        }

        return toDto(notebookRepository.save(entry));
    }

    @Override
    @Transactional
    public void delete(UUID id) throws IdInvalidException {
        UUID studentId = requireCurrentStudentId();
        StudentNotebookEntry entry = notebookRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Notebook entry không tồn tại"));
        if (!entry.getStudentId().equals(studentId)) {
            throw new IdInvalidException("Không có quyền xóa");
        }
        entry.setVoided(true);
        notebookRepository.save(entry);
    }

    private UUID requireCurrentStudentId() throws IdInvalidException {
        return SercurityUtil.getCurrentUserId()
                .orElseThrow(() -> new IdInvalidException("Cần đăng nhập"));
    }

    private ResNotebookEntryDTO toDto(StudentNotebookEntry entry) {
        ResNotebookEntryDTO dto = new ResNotebookEntryDTO();
        dto.setId(entry.getId());
        dto.setWordId(entry.getWordId());
        dto.setStoryId(entry.getStoryId());
        dto.setContextSentence(entry.getContextSentence());
        dto.setReviewStatus(entry.getReviewStatus() != null ? entry.getReviewStatus().name() : null);
        dto.setCreatedAt(entry.getCreatedAt());

        vocabularyWordRepository.findByIdAndVoidedFalse(entry.getWordId()).ifPresent(word -> {
            dto.setWordEn(word.getWordEn());
            dto.setMeaningVi(word.getMeaningVi());
            dto.setPhonetic(word.getPhonetic());
            dto.setAudioUkUrl(word.getAudioUkUrl());
            dto.setAudioUsUrl(word.getAudioUsUrl());
            dto.setPartOfSpeech(word.getPartOfSpeech());
        });

        storyRepository.findByIdAndVoidedFalse(entry.getStoryId()).ifPresent(story -> {
            dto.setStoryTitle(story.getTitle());
            dto.setStorySlug(story.getSlug());
        });

        return dto;
    }
}
