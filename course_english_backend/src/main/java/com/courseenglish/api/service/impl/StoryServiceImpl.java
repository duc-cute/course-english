package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Story;
import com.courseenglish.api.domain.VocabularySet;
import com.courseenglish.api.domain.VocabularyWord;
import com.courseenglish.api.domain.dto.story.StoryGlossaryEntryDTO;
import com.courseenglish.api.domain.dto.story.StoryTokensPayloadDTO;
import com.courseenglish.api.domain.dto.story.StoryTranslationsPayloadDTO;
import com.courseenglish.api.domain.request.ReqSearchStoryDTO;
import com.courseenglish.api.domain.request.ReqStoryDTO;
import com.courseenglish.api.domain.response.ResStoryDTO;
import com.courseenglish.api.domain.response.ResStoryReaderPayloadDTO;
import com.courseenglish.api.domain.response.ResStoryWordLookupDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.integration.dictionary.model.VocabularyEnrichmentData;
import com.courseenglish.api.integration.dictionary.service.DictionaryLookupService;
import com.courseenglish.api.repository.StoryRepository;
import com.courseenglish.api.repository.VocabularySetRepository;
import com.courseenglish.api.repository.VocabularyWordRepository;
import com.courseenglish.api.service.StoryService;
import com.courseenglish.api.service.story.StoryAudioService;
import com.courseenglish.api.service.story.StoryTokenizerService;
import com.courseenglish.api.service.story.StoryTranslationMergeService;
import com.courseenglish.api.util.CatalogSearchSpecs;
import com.courseenglish.api.util.LessonSlugUtil;
import com.courseenglish.api.util.PagingSearchUtil;
import com.courseenglish.api.util.StoryWordKeyUtil;
import com.courseenglish.api.util.constant.StoryProcessingStatusEnum;
import com.courseenglish.api.util.constant.StoryStatusEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StoryServiceImpl implements StoryService {

    private final StoryRepository storyRepository;
    private final VocabularySetRepository vocabularySetRepository;
    private final VocabularyWordRepository vocabularyWordRepository;
    private final DictionaryLookupService dictionaryLookupService;
    private final StoryTokenizerService storyTokenizerService;
    private final StoryTranslationMergeService storyTranslationMergeService;
    private final StoryAudioService storyAudioService;
    private final ObjectMapper objectMapper;

    public StoryServiceImpl(
            StoryRepository storyRepository,
            VocabularySetRepository vocabularySetRepository,
            VocabularyWordRepository vocabularyWordRepository,
            DictionaryLookupService dictionaryLookupService,
            StoryTokenizerService storyTokenizerService,
            StoryTranslationMergeService storyTranslationMergeService,
            StoryAudioService storyAudioService,
            ObjectMapper objectMapper) {
        this.storyRepository = storyRepository;
        this.vocabularySetRepository = vocabularySetRepository;
        this.vocabularyWordRepository = vocabularyWordRepository;
        this.dictionaryLookupService = dictionaryLookupService;
        this.storyTokenizerService = storyTokenizerService;
        this.storyTranslationMergeService = storyTranslationMergeService;
        this.storyAudioService = storyAudioService;
        this.objectMapper = objectMapper;
    }

    @Override
    public ResultPaginationDTO search(ReqSearchStoryDTO req) {
        ReqSearchStoryDTO payload = req == null ? new ReqSearchStoryDTO() : req;
        return searchWithSpec(payload, CatalogSearchSpecs.storySearch(payload));
    }

    @Override
    public ResultPaginationDTO searchWithSpec(ReqSearchStoryDTO req, Specification<Story> spec) {
        ReqSearchStoryDTO payload = req == null ? new ReqSearchStoryDTO() : req;
        Pageable pageable = PagingSearchUtil.toPageable(payload);

        Specification<Story> notVoidedSpec = (root, query, cb) -> cb.isFalse(root.get("voided"));
        Specification<Story> finalSpec = spec == null ? notVoidedSpec : spec.and(notVoidedSpec);

        Page<Story> page = storyRepository.findAll(finalSpec, pageable);

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
    public ResStoryDTO getById(UUID id) throws IdInvalidException {
        Story story = requireStory(id);
        return toDto(story);
    }

    @Override
    public ResStoryReaderPayloadDTO getReaderPayloadById(UUID id) throws IdInvalidException {
        Story story = requirePublishedStory(id);
        return toReaderPayload(story);
    }

    @Override
    public ResStoryReaderPayloadDTO getReaderPayloadBySlug(String slug) throws IdInvalidException {
        Story story = storyRepository.findBySlugAndVoidedFalse(slug)
                .orElseThrow(() -> new IdInvalidException("Story không tồn tại"));
        if (story.getStatus() != StoryStatusEnum.PUBLISHED) {
            throw new IdInvalidException("Story chưa được xuất bản");
        }
        return toReaderPayload(story);
    }

    @Override
    public ResStoryWordLookupDTO lookupWord(String word) throws IdInvalidException {
        if (word == null || word.isBlank()) {
            throw new IdInvalidException("Từ không hợp lệ");
        }
        String wordKey = StoryWordKeyUtil.toWordKey(word);
        if (wordKey.isBlank()) {
            throw new IdInvalidException("Từ không hợp lệ");
        }

        ResStoryWordLookupDTO dto = new ResStoryWordLookupDTO();
        dto.setWordEn(word.trim());
        dto.setWordKey(wordKey);

        Optional<VocabularyWord> existing = vocabularyWordRepository.findByWordKeyAndVoidedFalse(wordKey);
        if (existing.isPresent()) {
            VocabularyWord vocab = existing.get();
            dto.setVocabularyId(vocab.getId());
            dto.setMeaningVi(vocab.getMeaningVi());
            dto.setPhonetic(vocab.getPhonetic());
            dto.setAudioUkUrl(vocab.getAudioUkUrl());
            dto.setAudioUsUrl(vocab.getAudioUsUrl());
            dto.setPartOfSpeech(vocab.getPartOfSpeech());
            dto.setExampleSentence(vocab.getExampleSentence());
            dto.setInDatabase(true);
            dto.setMeaningSource("db");
            return dto;
        }

        Optional<VocabularyEnrichmentData> enrichment = dictionaryLookupService.lookup(wordKey);
        if (enrichment.isPresent()) {
            VocabularyEnrichmentData data = enrichment.get();
            dto.setPhonetic(data.getPhonetic());
            dto.setAudioUkUrl(data.getAudioUkUrl());
            dto.setAudioUsUrl(data.getAudioUsUrl());
            dto.setPartOfSpeech(data.getPartOfSpeech());
            dto.setInDatabase(false);
            dto.setMeaningSource("dictionary");
            return dto;
        }

        dto.setInDatabase(false);
        dto.setMeaningSource("none");
        return dto;
    }

    @Override
    @Transactional
    public ResStoryDTO create(ReqStoryDTO request) throws IdInvalidException {
        validateRequest(request);
        Story entity = new Story();
        applyFields(request, entity, true);
        tokenizeAndSave(entity);
        return toDto(entity);
    }

    @Override
    @Transactional
    public ResStoryDTO update(UUID id, ReqStoryDTO request) throws IdInvalidException {
        Story entity = requireStory(id);
        validateRequest(request);
        String previousContent = entity.getContent();
        UUID previousVocabSetId = entity.getVocabularySetId();
        String previousTranslations = entity.getTranslationsJson();
        applyFields(request, entity, false);
        boolean contentChanged = !previousContent.equals(entity.getContent());
        boolean shouldRetokenize = contentChanged
                || !java.util.Objects.equals(previousVocabSetId, entity.getVocabularySetId())
                || entity.getTokensJson() == null
                || entity.getTokensJson().isBlank();
        if (contentChanged
                && (request.getTranslationsJson() == null || request.getTranslationsJson().isBlank())
                && java.util.Objects.equals(previousTranslations, entity.getTranslationsJson())) {
            entity.setTranslationsJson(null);
        }
        if (shouldRetokenize) {
            tokenizeAndSave(entity);
            storyAudioService.invalidateAudio(entity.getId());
            entity.setProcessingStatus(StoryProcessingStatusEnum.TOKENIZED);
            storyRepository.save(entity);
        } else {
            storyRepository.save(entity);
        }
        return toDto(entity);
    }

    @Override
    @Transactional
    public void delete(UUID id) throws IdInvalidException {
        Story entity = requireStory(id);
        entity.setVoided(true);
        storyRepository.save(entity);
    }

    private void tokenizeAndSave(Story entity) throws IdInvalidException {
        StoryTokensPayloadDTO payload = storyTokenizerService.tokenize(entity.getContent(), entity.getVocabularySetId());
        StoryTranslationsPayloadDTO translations = readTranslations(entity.getTranslationsJson());
        storyTranslationMergeService.applySentenceTranslations(
                payload.getSentences(), translations.getSentenceTranslations());
        List<StoryGlossaryEntryDTO> enrichedGlossary = storyTranslationMergeService.buildReaderGlossary(
                payload.getTokens(), translations, true);
        translations.setGlossary(enrichedGlossary);
        try {
            entity.setTokensJson(objectMapper.writeValueAsString(payload));
            entity.setTranslationsJson(objectMapper.writeValueAsString(translations));
            entity.setProcessingStatus(StoryProcessingStatusEnum.TOKENIZED);
            storyRepository.save(entity);
        } catch (JsonProcessingException ex) {
            throw new IdInvalidException("Không lưu được tokens: " + ex.getMessage());
        }
    }

    private StoryTranslationsPayloadDTO readTranslations(String translationsJson) throws IdInvalidException {
        if (translationsJson == null || translationsJson.isBlank()) {
            return new StoryTranslationsPayloadDTO();
        }
        try {
            return objectMapper.readValue(translationsJson, StoryTranslationsPayloadDTO.class);
        } catch (JsonProcessingException ex) {
            throw new IdInvalidException("translations_json không hợp lệ");
        }
    }

    private void validateRequest(ReqStoryDTO request) throws IdInvalidException {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IdInvalidException("Tiêu đề không được để trống");
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new IdInvalidException("Nội dung không được để trống");
        }
        if (request.getVocabularySetId() != null) {
            vocabularySetRepository.findByIdAndVoidedFalse(request.getVocabularySetId())
                    .orElseThrow(() -> new IdInvalidException("Bộ từ vựng không tồn tại"));
        }
    }

    private void applyFields(ReqStoryDTO request, Story entity, boolean isCreate) throws IdInvalidException {
        String previousTitle = entity.getTitle();
        entity.setTitle(request.getTitle().trim());
        entity.setContent(request.getContent().trim());
        entity.setLevel(request.getLevel() != null ? request.getLevel().trim() : null);
        entity.setReadingTimeMinutes(request.getReadingTimeMinutes());
        entity.setPrompt(request.getPrompt() != null ? request.getPrompt().trim() : null);
        entity.setCoverImageUrl(request.getCoverImageUrl() != null ? request.getCoverImageUrl().trim() : null);
        entity.setVocabularySetId(request.getVocabularySetId());
        entity.setAiGenerated(request.isAiGenerated());
        if (request.getTranslationsJson() != null && !request.getTranslationsJson().isBlank()) {
            entity.setTranslationsJson(request.getTranslationsJson().trim());
        }
        if (request.getVoiceProfileJson() != null && !request.getVoiceProfileJson().isBlank()) {
            entity.setVoiceProfileJson(request.getVoiceProfileJson().trim());
        } else if (request.getVoiceProfileJson() != null) {
            entity.setVoiceProfileJson(null);
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                entity.setStatus(StoryStatusEnum.valueOf(request.getStatus().trim().toUpperCase()));
            } catch (IllegalArgumentException ex) {
                throw new IdInvalidException("Trạng thái story không hợp lệ");
            }
        } else if (isCreate) {
            entity.setStatus(StoryStatusEnum.DRAFT);
        }

        if (isCreate || previousTitle == null || !previousTitle.equalsIgnoreCase(request.getTitle().trim())) {
            entity.setSlug(resolveUniqueSlug(request.getTitle().trim(), isCreate ? null : entity.getId()));
        }
    }

    private String resolveUniqueSlug(String title, UUID excludeId) {
        String base = LessonSlugUtil.slugifyTitle(title);
        if (base.equals("bai-hoc")) {
            base = "story";
        }
        String candidate = base;
        int suffix = 2;
        while (slugTaken(candidate, excludeId)) {
            candidate = LessonSlugUtil.withSuffix(base, suffix++);
        }
        return candidate;
    }

    private boolean slugTaken(String slug, UUID excludeId) {
        if (excludeId == null) {
            return storyRepository.existsBySlugAndVoidedFalse(slug);
        }
        return storyRepository.existsBySlugAndVoidedFalseAndIdNot(slug, excludeId);
    }

    private Story requireStory(UUID id) throws IdInvalidException {
        return storyRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Story không tồn tại"));
    }

    private Story requirePublishedStory(UUID id) throws IdInvalidException {
        Story story = requireStory(id);
        if (story.getStatus() != StoryStatusEnum.PUBLISHED) {
            throw new IdInvalidException("Story chưa được xuất bản");
        }
        return story;
    }

    private ResStoryReaderPayloadDTO toReaderPayload(Story story) throws IdInvalidException {
        if (story.getTokensJson() == null || story.getTokensJson().isBlank()) {
            tokenizeAndSave(story);
        }
        try {
            StoryTokensPayloadDTO payload = objectMapper.readValue(story.getTokensJson(), StoryTokensPayloadDTO.class);
            StoryTranslationsPayloadDTO translations = readTranslations(story.getTranslationsJson());
            List<StoryGlossaryEntryDTO> glossary =
                    storyTranslationMergeService.buildReaderGlossary(payload.getTokens(), translations);

            ResStoryReaderPayloadDTO dto = new ResStoryReaderPayloadDTO();
            dto.setId(story.getId());
            dto.setTitle(story.getTitle());
            dto.setSlug(story.getSlug());
            dto.setLevel(story.getLevel());
            dto.setReadingTimeMinutes(story.getReadingTimeMinutes());
            dto.setVocabularySetId(story.getVocabularySetId());
            dto.setProcessingStatus(story.getProcessingStatus().name());
            dto.setTokens(payload.getTokens());
            dto.setSentences(payload.getSentences());
            dto.setGlossary(glossary);
            storyAudioService.attachAudioToReaderPayload(dto, story.getId());
            return dto;
        } catch (JsonProcessingException ex) {
            throw new IdInvalidException("Không đọc được tokens story");
        }
    }

    private ResStoryDTO toDto(Story story) {
        ResStoryDTO dto = new ResStoryDTO();
        dto.setId(story.getId());
        dto.setTitle(story.getTitle());
        dto.setSlug(story.getSlug());
        dto.setContent(story.getContent());
        dto.setLevel(story.getLevel());
        dto.setReadingTimeMinutes(story.getReadingTimeMinutes());
        dto.setPrompt(story.getPrompt());
        dto.setCoverImageUrl(story.getCoverImageUrl());
        dto.setVocabularySetId(story.getVocabularySetId());
        if (story.getVocabularySetId() != null) {
            vocabularySetRepository.findByIdAndVoidedFalse(story.getVocabularySetId())
                    .map(VocabularySet::getTitle)
                    .ifPresent(dto::setVocabularySetTitle);
        }
        dto.setStatus(story.getStatus().name());
        dto.setProcessingStatus(story.getProcessingStatus().name());
        dto.setAiGenerated(story.isAiGenerated());
        dto.setVoiceProfileJson(story.getVoiceProfileJson());
        dto.setCreatedAt(story.getCreatedAt());
        dto.setUpdatedAt(story.getUpdatedAt());
        dto.setCreatedBy(story.getCreatedBy());
        return dto;
    }
}
