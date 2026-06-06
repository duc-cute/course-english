package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Question;
import com.courseenglish.api.domain.QuestionCategory;
import com.courseenglish.api.domain.QuestionChoice;
import com.courseenglish.api.domain.request.ReqQuestionChoiceDTO;
import com.courseenglish.api.domain.request.ReqQuestionDTO;
import com.courseenglish.api.domain.request.ReqSearchQuestionDTO;
import com.courseenglish.api.domain.response.ResQuestionCategoryDTO;
import com.courseenglish.api.domain.response.ResQuestionChoiceDTO;
import com.courseenglish.api.domain.response.ResQuestionDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.QuestionCategoryRepository;
import com.courseenglish.api.repository.QuestionChoiceRepository;
import com.courseenglish.api.repository.QuestionRepository;
import com.courseenglish.api.service.QuestionService;
import com.courseenglish.api.util.CatalogSearchSpecs;
import com.courseenglish.api.util.PagingSearchUtil;
import com.courseenglish.api.util.constant.QuestionStatusEnum;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final QuestionCategoryRepository categoryRepository;
    private final QuestionChoiceRepository choiceRepository;
    private final ObjectMapper objectMapper;

    public QuestionServiceImpl(
            QuestionRepository questionRepository,
            QuestionCategoryRepository categoryRepository,
            QuestionChoiceRepository choiceRepository,
            ObjectMapper objectMapper) {
        this.questionRepository = questionRepository;
        this.categoryRepository = categoryRepository;
        this.choiceRepository = choiceRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public ResultPaginationDTO search(ReqSearchQuestionDTO req) {
        ReqSearchQuestionDTO payload = req == null ? new ReqSearchQuestionDTO() : req;
        Specification<Question> spec = CatalogSearchSpecs.questionSearch(payload);
        Pageable pageable = PagingSearchUtil.toPageable(payload);

        Specification<Question> notVoidedSpec = (root, query, cb) -> cb.isFalse(root.get("voided"));
        Specification<Question> finalSpec = spec == null ? notVoidedSpec : spec.and(notVoidedSpec);

        Page<Question> page = questionRepository.findAll(finalSpec, pageable);

        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setTotal(page.getTotalElements());
        meta.setPages(page.getTotalPages());

        ResultPaginationDTO dto = new ResultPaginationDTO();
        dto.setMeta(meta);
        dto.setResult(page.getContent().stream()
                .map(q -> toDto(q, false))
                .collect(Collectors.toList()));
        return dto;
    }

    @Override
    public ResQuestionDTO getById(UUID id) throws IdInvalidException {
        Question question = questionRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Câu hỏi không tồn tại"));
        return toDto(question, true);
    }

    @Override
    public List<ResQuestionDTO> findByIds(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return questionRepository.findByIdInAndVoidedFalse(ids).stream()
                .map(q -> toDto(q, true))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ResQuestionDTO create(ReqQuestionDTO request) throws IdInvalidException {
        validateRequest(request);
        Question entity = new Question();
        applyFields(request, entity);
        Question saved = questionRepository.save(entity);
        saveChoices(saved, request.getChoices());
        return toDto(saved, true);
    }

    @Override
    @Transactional
    public ResQuestionDTO update(UUID id, ReqQuestionDTO request) throws IdInvalidException {
        Question entity = questionRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Câu hỏi không tồn tại"));
        validateRequest(request);
        applyFields(request, entity);
        Question saved = questionRepository.save(entity);
        replaceChoices(saved, request.getChoices());
        return toDto(saved, true);
    }

    @Override
    @Transactional
    public void delete(UUID id) throws IdInvalidException {
        Question entity = questionRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Câu hỏi không tồn tại"));
        entity.setVoided(true);
        questionRepository.save(entity);
        voidExistingChoices(id);
    }

    @Override
    public List<ResQuestionCategoryDTO> listCategories() {
        return categoryRepository.findByVoidedFalseOrderByDisplayOrderAsc().stream()
                .map(this::toCategoryDto)
                .collect(Collectors.toList());
    }

    private void applyFields(ReqQuestionDTO request, Question target) throws IdInvalidException {
        target.setPromptText(request.getPromptText().trim());
        target.setPromptLang(request.getPromptLang() == null || request.getPromptLang().isBlank()
                ? "en"
                : request.getPromptLang().trim());
        target.setExplanation(trimOrNull(request.getExplanation()));
        target.setContentJson(trimOrNull(request.getContentJson()));
        target.setDifficulty(request.getDifficulty());

        QuestionTypeEnum type = request.getQuestionType() != null
                ? request.getQuestionType()
                : QuestionTypeEnum.MULTIPLE_CHOICE;
        target.setQuestionType(type);

        QuestionStatusEnum status = request.getStatus() != null
                ? request.getStatus()
                : QuestionStatusEnum.DRAFT;
        target.setStatus(status);

        target.setTagsJson(serializeTags(request.getTags()));
        target.setCategory(resolveCategory(request.getCategoryId()));
    }

    private QuestionCategory resolveCategory(UUID categoryId) throws IdInvalidException {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findByIdAndVoidedFalse(categoryId)
                .orElseThrow(() -> new IdInvalidException("Danh mục câu hỏi không tồn tại"));
    }

    private void saveChoices(Question question, List<ReqQuestionChoiceDTO> choices) {
        if (choices == null || choices.isEmpty()) {
            return;
        }
        int order = 0;
        for (ReqQuestionChoiceDTO item : choices) {
            QuestionChoice choice = new QuestionChoice();
            choice.setQuestion(question);
            choice.setChoiceKey(item.getChoiceKey().trim().toLowerCase());
            choice.setChoiceText(item.getChoiceText().trim());
            choice.setCorrect(Boolean.TRUE.equals(item.getCorrect()));
            choice.setDisplayOrder(item.getDisplayOrder() != null ? item.getDisplayOrder() : order);
            choiceRepository.save(choice);
            order++;
        }
    }

    /** Update: xóa hẳn choices cũ — soft-delete giữ UK (question_id, choice_key) nên insert mới bị trùng */
    private void replaceChoices(Question question, List<ReqQuestionChoiceDTO> choices) {
        List<QuestionChoice> existing = choiceRepository.findByQuestion_Id(question.getId());
        if (!existing.isEmpty()) {
            choiceRepository.deleteAll(existing);
            choiceRepository.flush();
        }
        saveChoices(question, choices);
    }

    private void voidExistingChoices(UUID questionId) {
        List<QuestionChoice> existing = choiceRepository
                .findByQuestion_IdAndVoidedFalseOrderByDisplayOrderAsc(questionId);
        for (QuestionChoice choice : existing) {
            choice.setVoided(true);
            choiceRepository.save(choice);
        }
    }

    private void validateRequest(ReqQuestionDTO request) throws IdInvalidException {
        if (request.getPromptText() == null || request.getPromptText().isBlank()) {
            throw new IdInvalidException("Nội dung câu hỏi không được để trống");
        }

        QuestionTypeEnum type = request.getQuestionType() != null
                ? request.getQuestionType()
                : QuestionTypeEnum.MULTIPLE_CHOICE;

        if (type == QuestionTypeEnum.MULTIPLE_CHOICE) {
            validateMcqChoices(request.getChoices());
        }
    }

    private void validateMcqChoices(List<ReqQuestionChoiceDTO> choices) throws IdInvalidException {
        if (choices == null || choices.size() < 2) {
            throw new IdInvalidException("Câu trắc nghiệm cần ít nhất 2 đáp án");
        }

        Set<String> keys = new HashSet<>();
        int correctCount = 0;

        for (int i = 0; i < choices.size(); i++) {
            ReqQuestionChoiceDTO c = choices.get(i);
            if (c.getChoiceKey() == null || c.getChoiceKey().isBlank()) {
                throw new IdInvalidException("Đáp án thứ " + (i + 1) + ": thiếu mã đáp án (a/b/c/d)");
            }
            if (c.getChoiceText() == null || c.getChoiceText().isBlank()) {
                throw new IdInvalidException("Đáp án thứ " + (i + 1) + ": nội dung không được để trống");
            }
            String key = c.getChoiceKey().trim().toLowerCase();
            if (!keys.add(key)) {
                throw new IdInvalidException("Mã đáp án \"" + key + "\" bị trùng");
            }
            if (Boolean.TRUE.equals(c.getCorrect())) {
                correctCount++;
            }
        }

        if (correctCount != 1) {
            throw new IdInvalidException("Cần chọn đúng một đáp án đúng");
        }
    }

    private ResQuestionDTO toDto(Question question, boolean includeChoices) {
        ResQuestionDTO dto = new ResQuestionDTO();
        dto.setId(question.getId());
        dto.setQuestionType(question.getQuestionType());
        dto.setStatus(question.getStatus());
        dto.setPromptText(question.getPromptText());
        dto.setPromptLang(question.getPromptLang());
        dto.setExplanation(question.getExplanation());
        dto.setContentJson(question.getContentJson());
        dto.setDifficulty(question.getDifficulty());
        dto.setTags(deserializeTags(question.getTagsJson()));
        dto.setCreatedAt(question.getCreatedAt());
        dto.setUpdatedAt(question.getUpdatedAt());

        if (question.getCategory() != null) {
            dto.setCategoryId(question.getCategory().getId());
            dto.setCategoryName(question.getCategory().getName());
        }

        if (includeChoices) {
            List<QuestionChoice> choices = choiceRepository
                    .findByQuestion_IdAndVoidedFalseOrderByDisplayOrderAsc(question.getId());
            dto.setChoices(choices.stream().map(this::toChoiceDto).collect(Collectors.toList()));
        }

        return dto;
    }

    private ResQuestionChoiceDTO toChoiceDto(QuestionChoice choice) {
        ResQuestionChoiceDTO dto = new ResQuestionChoiceDTO();
        dto.setId(choice.getId());
        dto.setChoiceKey(choice.getChoiceKey());
        dto.setChoiceText(choice.getChoiceText());
        dto.setCorrect(choice.isCorrect());
        dto.setDisplayOrder(choice.getDisplayOrder());
        return dto;
    }

    private ResQuestionCategoryDTO toCategoryDto(QuestionCategory category) {
        ResQuestionCategoryDTO dto = new ResQuestionCategoryDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setSlug(category.getSlug());
        dto.setDisplayOrder(category.getDisplayOrder());
        if (category.getParent() != null) {
            dto.setParentId(category.getParent().getId());
        }
        return dto;
    }

    private String serializeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(tags);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private List<String> deserializeTags(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }

    private String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @Override
    public List<ResQuestionDTO> findByIdsOrdered(List<UUID> ids, boolean publishedOnly) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        Map<UUID, ResQuestionDTO> byId = questionRepository.findByIdInAndVoidedFalse(ids).stream()
                .map(q -> toDto(q, true))
                .filter(q -> !publishedOnly || q.getStatus() == QuestionStatusEnum.PUBLISHED)
                .collect(Collectors.toMap(ResQuestionDTO::getId, Function.identity(), (a, b) -> a));

        List<ResQuestionDTO> ordered = new ArrayList<>();
        for (UUID id : ids) {
            ResQuestionDTO item = byId.get(id);
            if (item != null) {
                ordered.add(item);
            }
        }
        return ordered;
    }

    @Override
    public String buildResolvedQuestionsJson(List<UUID> ids, boolean publishedOnly) {
        List<Map<String, Object>> exerciseQuestions = findByIdsOrdered(ids, publishedOnly).stream()
                .map(this::toExerciseQuestionMap)
                .filter(map -> !map.isEmpty())
                .collect(Collectors.toList());
        try {
            return objectMapper.writeValueAsString(exerciseQuestions);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private Map<String, Object> toExerciseQuestionMap(ResQuestionDTO question) {
        if (question.getQuestionType() != QuestionTypeEnum.MULTIPLE_CHOICE) {
            return Map.of();
        }
        List<ResQuestionChoiceDTO> choices = question.getChoices();
        if (choices == null || choices.isEmpty()) {
            return Map.of();
        }

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", question.getId().toString());
        map.put("type", "MULTIPLE_CHOICE");

        Map<String, String> prompt = new LinkedHashMap<>();
        prompt.put("text", question.getPromptText());
        prompt.put("lang", question.getPromptLang() != null ? question.getPromptLang() : "en");
        map.put("prompt", prompt);

        List<Map<String, String>> choiceList = new ArrayList<>();
        String correctChoiceId = "";
        for (ResQuestionChoiceDTO choice : choices) {
            Map<String, String> item = new HashMap<>();
            item.put("id", choice.getChoiceKey());
            item.put("text", choice.getChoiceText());
            choiceList.add(item);
            if (choice.isCorrect()) {
                correctChoiceId = choice.getChoiceKey();
            }
        }
        map.put("choices", choiceList);

        if (correctChoiceId.isEmpty()) {
            return Map.of();
        }
        map.put("correctChoiceId", correctChoiceId);

        if (question.getExplanation() != null && !question.getExplanation().isBlank()) {
            map.put("explanation", question.getExplanation());
        }
        return map;
    }
}
