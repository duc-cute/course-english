package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Subject;
import com.courseenglish.api.domain.VocabularySet;
import com.courseenglish.api.domain.VocabularySetMember;
import com.courseenglish.api.domain.VocabularyWord;
import com.courseenglish.api.domain.request.ReqSearchVocabularySetDTO;
import com.courseenglish.api.domain.request.ReqVocabularyItemDTO;
import com.courseenglish.api.domain.request.ReqVocabularySetDTO;
import com.courseenglish.api.domain.response.ResVocabularyItemDTO;
import com.courseenglish.api.domain.response.ResVocabularySetDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.SubjectRepository;
import com.courseenglish.api.repository.VocabularySetMemberRepository;
import com.courseenglish.api.repository.VocabularySetRepository;
import com.courseenglish.api.service.VocabularySetService;
import com.courseenglish.api.service.VocabularyWordService;
import com.courseenglish.api.util.CatalogSearchSpecs;
import com.courseenglish.api.util.PagingSearchUtil;
import com.courseenglish.api.util.constant.VocabularySetStatusEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VocabularySetServiceImpl implements VocabularySetService {

    private final VocabularySetRepository setRepository;
    private final VocabularySetMemberRepository memberRepository;
    private final VocabularyWordService vocabularyWordService;
    private final SubjectRepository subjectRepository;
    private final ObjectMapper objectMapper;

    public VocabularySetServiceImpl(
            VocabularySetRepository setRepository,
            VocabularySetMemberRepository memberRepository,
            VocabularyWordService vocabularyWordService,
            SubjectRepository subjectRepository,
            ObjectMapper objectMapper) {
        this.setRepository = setRepository;
        this.memberRepository = memberRepository;
        this.vocabularyWordService = vocabularyWordService;
        this.subjectRepository = subjectRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public ResultPaginationDTO search(ReqSearchVocabularySetDTO req) {
        ReqSearchVocabularySetDTO payload = req == null ? new ReqSearchVocabularySetDTO() : req;
        return searchWithSpec(payload, CatalogSearchSpecs.vocabularySetSearch(payload));
    }

    @Override
    public ResultPaginationDTO searchWithSpec(ReqSearchVocabularySetDTO req, Specification<VocabularySet> spec) {
        ReqSearchVocabularySetDTO payload = req == null ? new ReqSearchVocabularySetDTO() : req;
        Pageable pageable = PagingSearchUtil.toPageable(payload);

        Specification<VocabularySet> notVoidedSpec = (root, query, cb) -> cb.isFalse(root.get("voided"));
        Specification<VocabularySet> finalSpec = spec == null ? notVoidedSpec : spec.and(notVoidedSpec);

        Page<VocabularySet> page = setRepository.findAll(finalSpec, pageable);

        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setTotal(page.getTotalElements());
        meta.setPages(page.getTotalPages());

        ResultPaginationDTO dto = new ResultPaginationDTO();
        dto.setMeta(meta);
        dto.setResult(page.getContent().stream()
                .map(v -> toDto(v, false))
                .collect(Collectors.toList()));
        return dto;
    }

    @Override
    public ResVocabularySetDTO getById(UUID id) throws IdInvalidException {
        VocabularySet set = setRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Bộ từ vựng không tồn tại"));
        return toDto(set, true);
    }

    @Override
    @Transactional
    public ResVocabularySetDTO create(ReqVocabularySetDTO request) throws IdInvalidException {
        validateRequest(request);
        VocabularySet entity = new VocabularySet();
        applyFields(request, entity);
        VocabularySet saved = setRepository.save(entity);
        saveMembers(saved, request.getItems());
        return toDto(saved, true);
    }

    @Override
    @Transactional
    public ResVocabularySetDTO update(UUID id, ReqVocabularySetDTO request) throws IdInvalidException {
        VocabularySet entity = setRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Bộ từ vựng không tồn tại"));
        validateRequest(request);
        applyFields(request, entity);
        VocabularySet saved = setRepository.save(entity);
        replaceMembers(saved, request.getItems());
        return toDto(saved, true);
    }

    @Override
    public String buildResolvedVocabularyJson(UUID setId, boolean publishedOnly) {
        if (setId == null) {
            return "[]";
        }
        Optional<VocabularySet> optional = setRepository.findByIdAndVoidedFalse(setId);
        if (optional.isEmpty()) {
            return "[]";
        }
        VocabularySet set = optional.get();
        if (publishedOnly && set.getStatus() != VocabularySetStatusEnum.PUBLISHED) {
            return "[]";
        }

        List<VocabularySetMember> members = memberRepository.findResolvedBySetId(setId);
        return serializeResolvedMembers(members);
    }

    @Override
    @Transactional
    public int enrichAll(UUID setId, boolean force) throws IdInvalidException {
        setRepository.findByIdAndVoidedFalse(setId)
                .orElseThrow(() -> new IdInvalidException("Bộ từ vựng không tồn tại"));

        List<VocabularySetMember> members = memberRepository.findResolvedBySetId(setId);
        if (members.isEmpty()) {
            return 0;
        }

        List<UUID> wordIds = members.stream()
                .map(VocabularySetMember::getVocabularyWord)
                .map(VocabularyWord::getId)
                .distinct()
                .toList();

        if (!force) {
            wordIds = members.stream()
                    .map(VocabularySetMember::getVocabularyWord)
                    .filter(word -> word.getEnrichedAt() == null)
                    .map(VocabularyWord::getId)
                    .distinct()
                    .toList();
        }

        return vocabularyWordService.enrichBatch(wordIds, force);
    }

    @Override
    @Transactional
    public void delete(UUID id) throws IdInvalidException {
        VocabularySet entity = setRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Bộ từ vựng không tồn tại"));
        entity.setVoided(true);
        setRepository.save(entity);
        voidExistingMembers(id);
    }

    private void applyFields(ReqVocabularySetDTO request, VocabularySet target) throws IdInvalidException {
        target.setTitle(request.getTitle().trim());
        target.setDescription(trimOrNull(request.getDescription()));
        target.setCoverImageUrl(trimOrNull(request.getCoverImageUrl()));
        target.setStatus(request.getStatus() != null ? request.getStatus() : VocabularySetStatusEnum.DRAFT);
        target.setSubject(resolveSubject(request.getSubjectId()));
    }

    private Subject resolveSubject(UUID subjectId) throws IdInvalidException {
        if (subjectId == null) {
            return null;
        }
        return subjectRepository.findByIdAndVoidedFalse(subjectId)
                .orElseThrow(() -> new IdInvalidException("Môn học không tồn tại"));
    }

    private void validateRequest(ReqVocabularySetDTO request) throws IdInvalidException {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IdInvalidException("Tiêu đề bộ từ không được để trống");
        }
        validateItems(request.getItems());
    }

    private void validateItems(List<ReqVocabularyItemDTO> items) throws IdInvalidException {
        if (items == null || items.isEmpty()) {
            throw new IdInvalidException("Bộ từ cần ít nhất một mục (word | meaning)");
        }

        Set<String> words = new HashSet<>();
        for (int i = 0; i < items.size(); i++) {
            ReqVocabularyItemDTO item = items.get(i);
            if (item.getWordEn() == null || item.getWordEn().isBlank()) {
                throw new IdInvalidException("Dòng " + (i + 1) + ": thiếu từ tiếng Anh");
            }
            if (item.getMeaningVi() == null || item.getMeaningVi().isBlank()) {
                throw new IdInvalidException("Dòng " + (i + 1) + ": thiếu nghĩa tiếng Việt");
            }
            String key = item.getWordEn().trim().toLowerCase();
            if (!words.add(key)) {
                throw new IdInvalidException("Từ \"" + item.getWordEn().trim() + "\" bị trùng trong bộ");
            }
        }
    }

    private void saveMembers(VocabularySet set, List<ReqVocabularyItemDTO> items) throws IdInvalidException {
        if (items == null || items.isEmpty()) {
            return;
        }
        int order = 0;
        for (ReqVocabularyItemDTO item : items) {
            VocabularyWord word =
                    vocabularyWordService.findOrCreateForSetItem(
                            item.getWordEn(),
                            item.getMeaningVi(),
                            item.getPartOfSpeech(),
                            item.getExampleSentence());
            VocabularySetMember member = new VocabularySetMember();
            member.setVocabularySet(set);
            member.setVocabularyWord(word);
            member.setDisplayOrder(item.getDisplayOrder() != null ? item.getDisplayOrder() : order);
            memberRepository.save(member);
            order++;
        }
    }

    private void replaceMembers(VocabularySet set, List<ReqVocabularyItemDTO> items) throws IdInvalidException {
        List<VocabularySetMember> existing = memberRepository.findByVocabularySet_Id(set.getId());
        if (!existing.isEmpty()) {
            memberRepository.deleteAll(existing);
            memberRepository.flush();
        }
        saveMembers(set, items);
    }

    private void voidExistingMembers(UUID setId) {
        List<VocabularySetMember> existing = memberRepository
                .findByVocabularySet_IdAndVoidedFalseOrderByDisplayOrderAsc(setId);
        for (VocabularySetMember member : existing) {
            member.setVoided(true);
            memberRepository.save(member);
        }
    }

    private ResVocabularySetDTO toDto(VocabularySet set, boolean includeItems) {
        ResVocabularySetDTO dto = new ResVocabularySetDTO();
        dto.setId(set.getId());
        dto.setTitle(set.getTitle());
        dto.setDescription(set.getDescription());
        dto.setCoverImageUrl(set.getCoverImageUrl());
        dto.setStatus(set.getStatus());
        dto.setCreatedAt(set.getCreatedAt());
        dto.setUpdatedAt(set.getUpdatedAt());
        dto.setItemCount(memberRepository.countByVocabularySet_IdAndVoidedFalse(set.getId()));

        if (set.getSubject() != null) {
            dto.setSubjectId(set.getSubject().getId());
            dto.setSubjectName(set.getSubject().getName());
        }

        if (includeItems) {
            List<VocabularySetMember> members = memberRepository.findResolvedBySetId(set.getId());
            dto.setItems(members.stream().map(this::toItemDtoFromMember).collect(Collectors.toList()));
        } else {
            dto.setPreviewWords(memberRepository.findPreviewWordEnsBySetId(
                    set.getId(), PageRequest.of(0, 3)));
        }

        return dto;
    }

    private ResVocabularyItemDTO toItemDtoFromMember(VocabularySetMember member) {
        VocabularyWord word = member.getVocabularyWord();
        ResVocabularyItemDTO dto = new ResVocabularyItemDTO();
        dto.setId(word.getId());
        dto.setWordEn(word.getWordEn());
        dto.setMeaningVi(word.getMeaningVi());
        dto.setPhonetic(word.getPhonetic());
        dto.setAudioUkUrl(word.getAudioUkUrl());
        dto.setAudioUsUrl(word.getAudioUsUrl());
        dto.setPartOfSpeech(word.getPartOfSpeech());
        dto.setExampleSentence(word.getExampleSentence());
        dto.setImageAssetId(word.getImageAssetId());
        dto.setAudioAssetId(word.getAudioAssetId());
        dto.setDisplayOrder(member.getDisplayOrder());
        return dto;
    }

    private String serializeResolvedMembers(List<VocabularySetMember> members) {
        List<Map<String, Object>> resolved = new ArrayList<>();
        for (VocabularySetMember member : members) {
            VocabularyWord word = member.getVocabularyWord();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", word.getId().toString());
            row.put("wordEn", word.getWordEn());
            row.put("meaningVi", word.getMeaningVi());
            if (word.getPhonetic() != null && !word.getPhonetic().isBlank()) {
                row.put("phonetic", word.getPhonetic());
            }
            if (word.getAudioUkUrl() != null && !word.getAudioUkUrl().isBlank()) {
                row.put("audioUkUrl", word.getAudioUkUrl());
            }
            if (word.getAudioUsUrl() != null && !word.getAudioUsUrl().isBlank()) {
                row.put("audioUsUrl", word.getAudioUsUrl());
            }
            if (word.getPartOfSpeech() != null && !word.getPartOfSpeech().isBlank()) {
                row.put("partOfSpeech", word.getPartOfSpeech());
            }
            if (word.getExampleSentence() != null && !word.getExampleSentence().isBlank()) {
                row.put("exampleSentence", word.getExampleSentence());
            }
            row.put("displayOrder", member.getDisplayOrder());
            resolved.add(row);
        }
        return toJson(resolved);
    }

    private String toJson(List<Map<String, Object>> resolved) {
        try {
            return objectMapper.writeValueAsString(resolved);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private String trimOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}

