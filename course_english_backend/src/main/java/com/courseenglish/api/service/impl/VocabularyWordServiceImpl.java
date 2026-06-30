package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.VocabularyWord;
import com.courseenglish.api.domain.request.ReqCreateVocabularyWordDTO;
import com.courseenglish.api.domain.request.ReqLookupVocabularyWordDTO;
import com.courseenglish.api.domain.request.ReqSearchVocabularyWordDTO;
import com.courseenglish.api.domain.request.ReqUpdateVocabularyWordDTO;
import com.courseenglish.api.domain.response.ResVocabularyWordDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.integration.dictionary.model.VocabularyEnrichmentData;
import com.courseenglish.api.integration.dictionary.service.DictionaryLookupService;
import com.courseenglish.api.repository.VocabularyWordRepository;
import com.courseenglish.api.service.VocabularyWordService;
import com.courseenglish.api.util.AppConstants;
import com.courseenglish.api.util.CatalogSearchSpecs;
import com.courseenglish.api.util.PagingSearchUtil;
import com.courseenglish.api.util.VocabularyWordKeyUtil;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class VocabularyWordServiceImpl implements VocabularyWordService {

    private final VocabularyWordRepository wordRepository;
    private final DictionaryLookupService dictionaryLookupService;

    public VocabularyWordServiceImpl(
            VocabularyWordRepository wordRepository,
            DictionaryLookupService dictionaryLookupService) {
        this.wordRepository = wordRepository;
        this.dictionaryLookupService = dictionaryLookupService;
    }

    @Override
    public ResultPaginationDTO search(ReqSearchVocabularyWordDTO req) {
        ReqSearchVocabularyWordDTO payload = req == null ? new ReqSearchVocabularyWordDTO() : req;
        Specification<VocabularyWord> spec = CatalogSearchSpecs.vocabularyWordSearch(payload);
        Pageable pageable = PagingSearchUtil.toPageable(payload);

        Specification<VocabularyWord> notVoidedSpec = (root, query, cb) -> cb.isFalse(root.get("voided"));
        Specification<VocabularyWord> finalSpec = spec == null ? notVoidedSpec : spec.and(notVoidedSpec);

        Page<VocabularyWord> page = wordRepository.findAll(finalSpec, pageable);

        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setTotal(page.getTotalElements());
        meta.setPages(page.getTotalPages());

        ResultPaginationDTO dto = new ResultPaginationDTO();
        dto.setMeta(meta);
        dto.setResult(page.getContent().stream().map(this::toDto).toList());
        return dto;
    }

    @Override
    public ResVocabularyWordDTO getById(UUID id) throws IdInvalidException {
        VocabularyWord word = wordRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Từ vựng không tồn tại"));
        return toDto(word);
    }

    @Override
    @Transactional
    public ResVocabularyWordDTO create(ReqCreateVocabularyWordDTO request) throws IdInvalidException {
        validateWordInput(request.getWordEn(), request.getMeaningVi());
        VocabularyWord word = findOrCreate(request.getWordEn(), request.getMeaningVi());
        return toDto(word);
    }

    @Override
    @Transactional
    public ResVocabularyWordDTO update(UUID id, ReqUpdateVocabularyWordDTO request) throws IdInvalidException {
        validateMeaningVi(request.getMeaningVi());
        VocabularyWord word = wordRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Từ vựng không tồn tại"));
        word.setMeaningVi(request.getMeaningVi().trim());
        return toDto(wordRepository.save(word));
    }

    @Override
    public Optional<ResVocabularyWordDTO> lookupPreview(ReqLookupVocabularyWordDTO request) {
        if (request.getWordEn() == null || request.getWordEn().isBlank()) {
            return Optional.empty();
        }
        return dictionaryLookupService.lookup(request.getWordEn().trim())
                .map(this::previewFromEnrichment);
    }

    @Override
    @Transactional
    public ResVocabularyWordDTO enrich(UUID id, boolean force) throws IdInvalidException {
        VocabularyWord word = wordRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Từ vựng không tồn tại"));
        return toDto(enrichWord(word, force));
    }

    @Override
    @Transactional
    public VocabularyWord findOrCreate(String wordEn, String meaningVi) throws IdInvalidException {
        return findOrCreateForSetItem(wordEn, meaningVi, null, null);
    }

    @Override
    @Transactional
    public VocabularyWord findOrCreateForSetItem(
            String wordEn,
            String meaningVi,
            String partOfSpeech,
            String exampleSentence) throws IdInvalidException {
        validateWordInput(wordEn, meaningVi);

        String wordKey = VocabularyWordKeyUtil.toWordKey(wordEn);
        Optional<VocabularyWord> existing = wordRepository.findByWordKeyAndVoidedFalse(wordKey);
        if (existing.isPresent()) {
            VocabularyWord word = existing.get();
            applyNullableWordExtras(word, partOfSpeech, exampleSentence);
            return wordRepository.save(word);
        }

        VocabularyWord word = new VocabularyWord();
        word.setWordKey(wordKey);
        word.setWordEn(VocabularyWordKeyUtil.normalizeWordEn(wordEn));
        word.setMeaningVi(meaningVi.trim());
        applyNullableWordExtras(word, partOfSpeech, exampleSentence);
        VocabularyWord saved = wordRepository.save(word);
        return enrichWord(saved, false);
    }

    private void applyNullableWordExtras(
            VocabularyWord word, String partOfSpeech, String exampleSentence) {
        if (isBlank(word.getPartOfSpeech()) && !isBlank(partOfSpeech)) {
            word.setPartOfSpeech(partOfSpeech.trim());
        }
        if (isBlank(word.getExampleSentence()) && !isBlank(exampleSentence)) {
            word.setExampleSentence(exampleSentence.trim());
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    @Override
    @Transactional
    public int enrichBatch(List<UUID> wordIds, boolean force) {
        if (wordIds == null || wordIds.isEmpty()) {
            return 0;
        }
        int count = 0;
        for (UUID wordId : wordIds) {
            Optional<VocabularyWord> optional = wordRepository.findByIdAndVoidedFalse(wordId);
            if (optional.isEmpty()) {
                continue;
            }
            enrichWord(optional.get(), force);
            count++;
        }
        return count;
    }

    @Override
    public ResVocabularyWordDTO toDto(VocabularyWord word) {
        ResVocabularyWordDTO dto = new ResVocabularyWordDTO();
        dto.setId(word.getId());
        dto.setWordKey(word.getWordKey());
        dto.setWordEn(word.getWordEn());
        dto.setMeaningVi(word.getMeaningVi());
        dto.setPhonetic(word.getPhonetic());
        dto.setAudioUkUrl(word.getAudioUkUrl());
        dto.setAudioUsUrl(word.getAudioUsUrl());
        dto.setPartOfSpeech(word.getPartOfSpeech());
        dto.setExampleSentence(word.getExampleSentence());
        dto.setImageAssetId(word.getImageAssetId());
        dto.setAudioAssetId(word.getAudioAssetId());
        dto.setEnrichedAt(word.getEnrichedAt());
        dto.setEnrichSource(word.getEnrichSource());
        dto.setCreatedAt(word.getCreatedAt());
        dto.setUpdatedAt(word.getUpdatedAt());
        return dto;
    }

    private VocabularyWord enrichWord(VocabularyWord word, boolean force) {
        if (!AppConstants.dictionaryEnrichEnabled) {
            return word;
        }
        if (!force && word.getEnrichedAt() != null) {
            return word;
        }

        Optional<VocabularyEnrichmentData> enrichment = dictionaryLookupService.lookup(word.getWordEn());
        if (enrichment.isPresent()) {
            applyEnrichment(word, enrichment.get());
        }

        word.setEnrichedAt(Instant.now());
        return wordRepository.save(word);
    }

    private void applyEnrichment(VocabularyWord word, VocabularyEnrichmentData data) {
        if (data.getPhonetic() != null && !data.getPhonetic().isBlank()) {
            word.setPhonetic(data.getPhonetic().trim());
        }
        if (data.getAudioUkUrl() != null && !data.getAudioUkUrl().isBlank()) {
            word.setAudioUkUrl(data.getAudioUkUrl().trim());
        }
        if (data.getAudioUsUrl() != null && !data.getAudioUsUrl().isBlank()) {
            word.setAudioUsUrl(data.getAudioUsUrl().trim());
        }
        if (data.getPartOfSpeech() != null && !data.getPartOfSpeech().isBlank()
            && isBlank(word.getPartOfSpeech())) {
            word.setPartOfSpeech(data.getPartOfSpeech().trim());
        }
        if (data.getEnrichSource() != null && !data.getEnrichSource().isBlank()) {
            word.setEnrichSource(data.getEnrichSource().trim());
        }
    }

    private ResVocabularyWordDTO previewFromEnrichment(VocabularyEnrichmentData data) {
        ResVocabularyWordDTO dto = new ResVocabularyWordDTO();
        dto.setWordEn(data.getWordEn());
        dto.setPhonetic(data.getPhonetic());
        dto.setAudioUkUrl(data.getAudioUkUrl());
        dto.setAudioUsUrl(data.getAudioUsUrl());
        dto.setPartOfSpeech(data.getPartOfSpeech());
        dto.setEnrichSource(data.getEnrichSource());
        return dto;
    }

    private void validateWordInput(String wordEn, String meaningVi) throws IdInvalidException {
        if (wordEn == null || wordEn.isBlank()) {
            throw new IdInvalidException("Từ tiếng Anh không được để trống");
        }
        validateMeaningVi(meaningVi);
        if (wordEn.trim().length() > 255) {
            throw new IdInvalidException("Từ tiếng Anh quá dài (tối đa 255 ký tự)");
        }
    }

    private void validateMeaningVi(String meaningVi) throws IdInvalidException {
        if (meaningVi == null || meaningVi.isBlank()) {
            throw new IdInvalidException("Nghĩa tiếng Việt không được để trống");
        }
    }
}
