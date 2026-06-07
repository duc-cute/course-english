package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Subject;
import com.courseenglish.api.domain.VocabularyItem;
import com.courseenglish.api.domain.VocabularySet;
import com.courseenglish.api.domain.request.ReqSearchVocabularySetDTO;
import com.courseenglish.api.domain.request.ReqVocabularyItemDTO;
import com.courseenglish.api.domain.request.ReqVocabularySetDTO;
import com.courseenglish.api.domain.response.ResVocabularyItemDTO;
import com.courseenglish.api.domain.response.ResVocabularySetDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.SubjectRepository;
import com.courseenglish.api.repository.VocabularyItemRepository;
import com.courseenglish.api.repository.VocabularySetRepository;
import com.courseenglish.api.service.VocabularySetService;
import com.courseenglish.api.util.CatalogSearchSpecs;
import com.courseenglish.api.util.PagingSearchUtil;
import com.courseenglish.api.util.constant.VocabularySetStatusEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
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
    private final VocabularyItemRepository itemRepository;
    private final SubjectRepository subjectRepository;
    private final ObjectMapper objectMapper;

    public VocabularySetServiceImpl(
            VocabularySetRepository setRepository,
            VocabularyItemRepository itemRepository,
            SubjectRepository subjectRepository,
            ObjectMapper objectMapper) {
        this.setRepository = setRepository;
        this.itemRepository = itemRepository;
        this.subjectRepository = subjectRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public ResultPaginationDTO search(ReqSearchVocabularySetDTO req) {
        ReqSearchVocabularySetDTO payload = req == null ? new ReqSearchVocabularySetDTO() : req;
        Specification<VocabularySet> spec = CatalogSearchSpecs.vocabularySetSearch(payload);
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
        saveItems(saved, request.getItems());
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
        replaceItems(saved, request.getItems());
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
        List<VocabularyItem> items = itemRepository
                .findByVocabularySet_IdAndVoidedFalseOrderByDisplayOrderAsc(setId);
        List<Map<String, Object>> resolved = new ArrayList<>();
        for (VocabularyItem item : items) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", item.getId().toString());
            row.put("wordEn", item.getWordEn());
            row.put("meaningVi", item.getMeaningVi());
            if (item.getPhonetic() != null && !item.getPhonetic().isBlank()) {
                row.put("phonetic", item.getPhonetic());
            }
            row.put("displayOrder", item.getDisplayOrder());
            resolved.add(row);
        }
        try {
            return objectMapper.writeValueAsString(resolved);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    @Override
    @Transactional
    public void delete(UUID id) throws IdInvalidException {
        VocabularySet entity = setRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Bộ từ vựng không tồn tại"));
        entity.setVoided(true);
        setRepository.save(entity);
        voidExistingItems(id);
    }

    private void applyFields(ReqVocabularySetDTO request, VocabularySet target) throws IdInvalidException {
        target.setTitle(request.getTitle().trim());
        target.setDescription(trimOrNull(request.getDescription()));
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

    private void saveItems(VocabularySet set, List<ReqVocabularyItemDTO> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        int order = 0;
        for (ReqVocabularyItemDTO item : items) {
            VocabularyItem entity = new VocabularyItem();
            entity.setVocabularySet(set);
            entity.setWordEn(item.getWordEn().trim());
            entity.setMeaningVi(item.getMeaningVi().trim());
            entity.setPhonetic(trimOrNull(item.getPhonetic()));
            entity.setDisplayOrder(item.getDisplayOrder() != null ? item.getDisplayOrder() : order);
            itemRepository.save(entity);
            order++;
        }
    }

    private void replaceItems(VocabularySet set, List<ReqVocabularyItemDTO> items) {
        List<VocabularyItem> existing = itemRepository.findByVocabularySet_Id(set.getId());
        if (!existing.isEmpty()) {
            itemRepository.deleteAll(existing);
            itemRepository.flush();
        }
        saveItems(set, items);
    }

    private void voidExistingItems(UUID setId) {
        List<VocabularyItem> existing = itemRepository.findByVocabularySet_IdAndVoidedFalseOrderByDisplayOrderAsc(setId);
        for (VocabularyItem item : existing) {
            item.setVoided(true);
            itemRepository.save(item);
        }
    }

    private ResVocabularySetDTO toDto(VocabularySet set, boolean includeItems) {
        ResVocabularySetDTO dto = new ResVocabularySetDTO();
        dto.setId(set.getId());
        dto.setTitle(set.getTitle());
        dto.setDescription(set.getDescription());
        dto.setStatus(set.getStatus());
        dto.setCreatedAt(set.getCreatedAt());
        dto.setUpdatedAt(set.getUpdatedAt());
        dto.setItemCount(itemRepository.countByVocabularySet_IdAndVoidedFalse(set.getId()));

        if (set.getSubject() != null) {
            dto.setSubjectId(set.getSubject().getId());
            dto.setSubjectName(set.getSubject().getName());
        }

        if (includeItems) {
            List<VocabularyItem> items = itemRepository
                    .findByVocabularySet_IdAndVoidedFalseOrderByDisplayOrderAsc(set.getId());
            dto.setItems(items.stream().map(this::toItemDto).collect(Collectors.toList()));
        }

        return dto;
    }

    private ResVocabularyItemDTO toItemDto(VocabularyItem item) {
        ResVocabularyItemDTO dto = new ResVocabularyItemDTO();
        dto.setId(item.getId());
        dto.setWordEn(item.getWordEn());
        dto.setMeaningVi(item.getMeaningVi());
        dto.setPhonetic(item.getPhonetic());
        dto.setImageAssetId(item.getImageAssetId());
        dto.setAudioAssetId(item.getAudioAssetId());
        dto.setDisplayOrder(item.getDisplayOrder());
        return dto;
    }

    private String trimOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
