package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Question;
import com.courseenglish.api.domain.QuestionCategory;
import com.courseenglish.api.domain.QuestionChoice;
import com.courseenglish.api.domain.request.ReqExportQuestionsDTO;
import com.courseenglish.api.domain.request.ReqBulkQuestionDTO;
import com.courseenglish.api.domain.request.ReqQuestionChoiceDTO;
import com.courseenglish.api.domain.request.ReqQuestionDTO;
import com.courseenglish.api.domain.request.ReqSearchQuestionDTO;
import com.courseenglish.api.domain.request.ReqExportQuestionsDTO;
import com.courseenglish.api.domain.response.ResBulkQuestionResultDTO;
import com.courseenglish.api.domain.response.ResQuestionExportDTO;
import com.courseenglish.api.domain.response.ResQuestionCategoryDTO;
import com.courseenglish.api.domain.response.ResQuestionChoiceDTO;
import com.courseenglish.api.domain.response.ResQuestionDTO;
import com.courseenglish.api.domain.response.ResQuestionStatsDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.QuestionCategoryRepository;
import com.courseenglish.api.repository.QuestionChoiceRepository;
import com.courseenglish.api.repository.QuestionRepository;
import com.courseenglish.api.service.QuestionService;
import com.courseenglish.api.util.CatalogSearchSpecs;
import com.courseenglish.api.util.PagingSearchUtil;
import com.courseenglish.api.util.constant.BulkQuestionOperationEnum;
import com.courseenglish.api.util.constant.QuestionSourceEnum;
import com.courseenglish.api.util.constant.QuestionStatusEnum;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class QuestionServiceImpl implements QuestionService {

    private static final Pattern FILL_BLANK_RUN_RE = Pattern.compile("_{3,}");

    private static final int BULK_MAX_IDS = 100;

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
        persistChoices(saved, request.getQuestionType(), request.getChoices());
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
        persistChoices(saved, request.getQuestionType(), request.getChoices());
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
    @Transactional
    public ResBulkQuestionResultDTO bulk(ReqBulkQuestionDTO request) throws IdInvalidException {
        if (request == null || request.getIds() == null || request.getIds().isEmpty()) {
            throw new IdInvalidException("Danh sách id không được rỗng");
        }
        if (request.getIds().size() > BULK_MAX_IDS) {
            throw new IdInvalidException("Tối đa " + BULK_MAX_IDS + " câu mỗi lần");
        }
        if (request.getOperation() == null) {
            throw new IdInvalidException("Thiếu operation");
        }

        List<UUID> uniqueIds = request.getIds().stream().distinct().toList();
        List<Question> found = questionRepository.findByIdInAndVoidedFalse(uniqueIds);
        Set<UUID> foundIds = found.stream().map(Question::getId).collect(Collectors.toSet());

        List<UUID> notFoundIds = uniqueIds.stream()
                .filter(id -> !foundIds.contains(id))
                .toList();

        BulkQuestionOperationEnum op = request.getOperation();
        List<UUID> createdIds = new ArrayList<>();

        if (op == BulkQuestionOperationEnum.DELETE) {
            for (Question entity : found) {
                entity.setVoided(true);
                voidExistingChoices(entity.getId());
            }
            questionRepository.saveAll(found);
        } else if (op == BulkQuestionOperationEnum.DUPLICATE) {
            Map<UUID, Question> byId =
                    found.stream().collect(Collectors.toMap(Question::getId, Function.identity()));
            for (UUID id : uniqueIds) {
                Question source = byId.get(id);
                if (source == null) {
                    continue;
                }
                createdIds.add(duplicateQuestion(source).getId());
            }
        } else {
            QuestionStatusEnum status = mapBulkOperationToStatus(op);
            for (Question entity : found) {
                entity.setStatus(status);
            }
            questionRepository.saveAll(found);
        }

        ResBulkQuestionResultDTO result = new ResBulkQuestionResultDTO();
        result.setRequested(uniqueIds.size());
        result.setAffected(op == BulkQuestionOperationEnum.DUPLICATE ? createdIds.size() : found.size());
        result.setNotFoundIds(new ArrayList<>(notFoundIds));
        result.setCreatedIds(createdIds);
        return result;
    }

    @Override
    public ResQuestionExportDTO export(ReqExportQuestionsDTO request) throws IdInvalidException {
        if (request == null || request.getIds() == null || request.getIds().isEmpty()) {
            throw new IdInvalidException("Danh sách id không được rỗng");
        }
        if (request.getIds().size() > BULK_MAX_IDS) {
            throw new IdInvalidException("Tối đa " + BULK_MAX_IDS + " câu mỗi lần");
        }

        List<UUID> uniqueIds = request.getIds().stream().distinct().toList();
        List<Question> found = questionRepository.findByIdInAndVoidedFalse(uniqueIds);
        Map<UUID, Question> byId =
                found.stream().collect(Collectors.toMap(Question::getId, Function.identity()));

        List<UUID> notFoundIds = uniqueIds.stream()
                .filter(id -> !byId.containsKey(id))
                .toList();

        List<ResQuestionDTO> questions = new ArrayList<>();
        for (UUID id : uniqueIds) {
            Question q = byId.get(id);
            if (q != null) {
                questions.add(toDto(q, true));
            }
        }

        ResQuestionExportDTO dto = new ResQuestionExportDTO();
        dto.setExportedAt(Instant.now());
        dto.setRequested(uniqueIds.size());
        dto.setExported(questions.size());
        dto.setNotFoundIds(new ArrayList<>(notFoundIds));
        dto.setQuestions(questions);
        return dto;
    }

    private Question duplicateQuestion(Question source) {
        Question copy = new Question();
        copy.setCategory(source.getCategory());
        copy.setQuestionType(source.getQuestionType());
        copy.setStatus(QuestionStatusEnum.DRAFT);
        copy.setTitle(duplicateTitle(source.getTitle(), source.getPromptText()));
        copy.setPromptText(source.getPromptText());
        copy.setPromptLang(source.getPromptLang());
        copy.setExplanation(source.getExplanation());
        copy.setContentJson(source.getContentJson());
        copy.setDifficulty(source.getDifficulty());
        copy.setCefrLevel(source.getCefrLevel());
        copy.setSkill(source.getSkill());
        copy.setTopic(source.getTopic());
        copy.setSource(QuestionSourceEnum.MANUAL);
        copy.setAiGenerated(false);
        copy.setTagsJson(appendDuplicateSourceTag(source.getTagsJson(), source.getId()));

        Question saved = questionRepository.save(copy);

        List<QuestionChoice> choices =
                choiceRepository.findByQuestion_IdAndVoidedFalseOrderByDisplayOrderAsc(source.getId());
        if (!choices.isEmpty()) {
            int order = 0;
            for (QuestionChoice c : choices) {
                QuestionChoice nc = new QuestionChoice();
                nc.setQuestion(saved);
                nc.setChoiceKey(c.getChoiceKey());
                nc.setChoiceText(c.getChoiceText());
                nc.setCorrect(c.isCorrect());
                nc.setDisplayOrder(order);
                choiceRepository.save(nc);
                order++;
            }
        }
        return saved;
    }

    private static String duplicateTitle(String title, String promptText) {
        String base;
        if (title != null && !title.isBlank()) {
            base = title.trim();
        } else if (promptText != null && !promptText.isBlank()) {
            base = promptText.trim();
            if (base.length() > 80) {
                base = base.substring(0, 80) + "…";
            }
        } else {
            base = "Question";
        }
        String suffix = " (copy)";
        int maxLen = 255;
        if (base.length() + suffix.length() > maxLen) {
            return base.substring(0, maxLen - suffix.length()) + suffix;
        }
        return base + suffix;
    }

    private String appendDuplicateSourceTag(String tagsJson, UUID sourceId) {
        List<String> tags = new ArrayList<>(deserializeTags(tagsJson));
        String tag = "dup-from:" + sourceId;
        if (!tags.contains(tag)) {
            tags.add(tag);
        }
        return serializeTags(tags);
    }

    private static QuestionStatusEnum mapBulkOperationToStatus(BulkQuestionOperationEnum op)
            throws IdInvalidException {
        return switch (op) {
            case PUBLISH -> QuestionStatusEnum.PUBLISHED;
            case ARCHIVE -> QuestionStatusEnum.ARCHIVED;
            case DRAFT -> QuestionStatusEnum.DRAFT;
            case DELETE, DUPLICATE -> throw new IdInvalidException("Operation không map status");
        };
    }

    @Override
    public List<ResQuestionCategoryDTO> listCategories() {
        return categoryRepository.findByVoidedFalseOrderByDisplayOrderAsc().stream()
                .map(this::toCategoryDto)
                .collect(Collectors.toList());
    }

    @Override
    public ResQuestionStatsDTO getStats() {
        ResQuestionStatsDTO dto = new ResQuestionStatsDTO();
        dto.setTotal(questionRepository.countByVoidedFalse());
        dto.setAiGeneratedCount(questionRepository.countByVoidedFalseAndAiGeneratedTrue());

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (Object[] row : questionRepository.countGroupByStatus()) {
            if (row[0] != null && row[1] != null) {
                byStatus.put(row[0].toString(), ((Number) row[1]).longValue());
            }
        }
        dto.setByStatus(byStatus);

        Map<String, Long> byType = new LinkedHashMap<>();
        for (Object[] row : questionRepository.countGroupByQuestionType()) {
            if (row[0] != null && row[1] != null) {
                byType.put(row[0].toString(), ((Number) row[1]).longValue());
            }
        }
        dto.setByType(byType);

        return dto;
    }

    private void applyFields(ReqQuestionDTO request, Question target) throws IdInvalidException {
        target.setTitle(trimOrNull(request.getTitle()));
        target.setPromptText(request.getPromptText().trim());
        target.setPromptLang(request.getPromptLang() == null || request.getPromptLang().isBlank()
                ? "en"
                : request.getPromptLang().trim());
        target.setExplanation(trimOrNull(request.getExplanation()));
        target.setContentJson(trimOrNull(request.getContentJson()));
        target.setDifficulty(request.getDifficulty());
        target.setCefrLevel(upperOrNull(request.getCefrLevel()));
        target.setSkill(upperOrNull(request.getSkill()));
        target.setTopic(trimOrNull(request.getTopic()));

        QuestionTypeEnum type = request.getQuestionType() != null
                ? request.getQuestionType()
                : QuestionTypeEnum.MULTIPLE_CHOICE;
        target.setQuestionType(type);

        QuestionStatusEnum status = request.getStatus() != null
                ? request.getStatus()
                : QuestionStatusEnum.DRAFT;
        target.setStatus(status);

        if (request.getSource() != null) {
            target.setSource(request.getSource());
        } else if (target.getSource() == null) {
            target.setSource(QuestionSourceEnum.MANUAL);
        }
        if (request.getAiGenerated() != null) {
            target.setAiGenerated(request.getAiGenerated());
        }

        target.setTagsJson(serializeTags(request.getTags()));
        target.setCategory(resolveCategory(request.getCategoryId()));
    }

    private void persistChoices(
            Question question,
            QuestionTypeEnum type,
            List<ReqQuestionChoiceDTO> choices) {
        QuestionTypeEnum resolved = type != null ? type : QuestionTypeEnum.MULTIPLE_CHOICE;
        if (resolved == QuestionTypeEnum.MULTIPLE_CHOICE) {
            replaceChoices(question, choices);
        } else {
            voidExistingChoices(question.getId());
        }
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
        } else if (type == QuestionTypeEnum.TRUE_FALSE) {
            validateTrueFalseContent(request.getContentJson());
        } else if (type == QuestionTypeEnum.FILL_BLANK) {
            validateFillBlankContent(request.getPromptText(), request.getContentJson());
        }
    }

    private void validateTrueFalseContent(String contentJson) throws IdInvalidException {
        JsonNode node = parseContentJson(contentJson);
        if (node == null || !node.has("correctAnswer") || !node.get("correctAnswer").isBoolean()) {
            throw new IdInvalidException("Câu Đúng/Sai cần contentJson.correctAnswer (boolean)");
        }
    }

    private void validateFillBlankContent(String promptText, String contentJson) throws IdInvalidException {
        int blankCount = countBlankPlaceholders(promptText);
        if (blankCount < 1) {
            throw new IdInvalidException("Câu điền từ cần ít nhất một chỗ trống (___)");
        }
        JsonNode node = parseContentJson(contentJson);
        if (node == null || !node.has("blanks") || !node.get("blanks").isArray()) {
            throw new IdInvalidException("Câu điền từ cần contentJson.blanks");
        }
        JsonNode blanks = node.get("blanks");
        if (blanks.size() != blankCount) {
            throw new IdInvalidException("Số blanks phải khớp số chỗ trống (___) trong câu");
        }
        for (int i = 0; i < blanks.size(); i++) {
            JsonNode blank = blanks.get(i);
            if (!blank.has("acceptedAnswers") || !blank.get("acceptedAnswers").isArray()
                    || blank.get("acceptedAnswers").isEmpty()) {
                throw new IdInvalidException("Blank thứ " + (i + 1) + ": thiếu acceptedAnswers");
            }
            boolean hasAnswer = false;
            for (JsonNode ans : blank.get("acceptedAnswers")) {
                if (ans != null && !ans.asText("").isBlank()) {
                    hasAnswer = true;
                    break;
                }
            }
            if (!hasAnswer) {
                throw new IdInvalidException("Blank thứ " + (i + 1) + ": cần ít nhất một đáp án");
            }
        }
    }

    private JsonNode parseContentJson(String contentJson) {
        if (contentJson == null || contentJson.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(contentJson);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private int countBlankPlaceholders(String promptText) {
        if (promptText == null || promptText.isBlank()) {
            return 0;
        }
        Matcher matcher = FILL_BLANK_RUN_RE.matcher(promptText);
        int count = 0;
        while (matcher.find()) {
            count++;
        }
        return count;
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
        dto.setTitle(question.getTitle());
        dto.setQuestionType(question.getQuestionType());
        dto.setStatus(question.getStatus());
        dto.setPromptText(question.getPromptText());
        dto.setPromptLang(question.getPromptLang());
        dto.setExplanation(question.getExplanation());
        dto.setContentJson(question.getContentJson());
        dto.setDifficulty(question.getDifficulty());
        dto.setCefrLevel(question.getCefrLevel());
        dto.setSkill(question.getSkill());
        dto.setTopic(question.getTopic());
        dto.setSource(question.getSource());
        dto.setAiGenerated(question.isAiGenerated());
        dto.setTags(deserializeTags(question.getTagsJson()));
        dto.setCreatedBy(question.getCreatedBy());
        dto.setUpdatedBy(question.getUpdatedBy());
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

    private String upperOrNull(String value) {
        String trimmed = trimOrNull(value);
        return trimmed == null ? null : trimmed.toUpperCase();
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
        if (question.getQuestionType() == null) {
            return Map.of();
        }
        return switch (question.getQuestionType()) {
            case MULTIPLE_CHOICE -> toMcqExerciseMap(question);
            case TRUE_FALSE -> toTrueFalseExerciseMap(question);
            case FILL_BLANK -> toFillBlankExerciseMap(question);
            default -> Map.of();
        };
    }

    private Map<String, Object> toMcqExerciseMap(ResQuestionDTO question) {
        List<ResQuestionChoiceDTO> choices = question.getChoices();
        if (choices == null || choices.isEmpty()) {
            return Map.of();
        }

        Map<String, Object> map = baseExerciseMap(question, "MULTIPLE_CHOICE");

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
        return map;
    }

    private Map<String, Object> toTrueFalseExerciseMap(ResQuestionDTO question) {
        JsonNode node = parseContentJson(question.getContentJson());
        if (node == null || !node.has("correctAnswer") || !node.get("correctAnswer").isBoolean()) {
            return Map.of();
        }
        Map<String, Object> map = baseExerciseMap(question, "TRUE_FALSE");
        map.put("correctAnswer", node.get("correctAnswer").asBoolean());
        return map;
    }

    private Map<String, Object> toFillBlankExerciseMap(ResQuestionDTO question) {
        JsonNode node = parseContentJson(question.getContentJson());
        if (node == null || !node.has("blanks") || !node.get("blanks").isArray()) {
            return Map.of();
        }
        Map<String, Object> map = baseExerciseMap(question, "FILL_BLANK");
        map.put("blanks", objectMapper.convertValue(node.get("blanks"), List.class));
        if (node.has("caseSensitive") && node.get("caseSensitive").isBoolean()) {
            map.put("caseSensitive", node.get("caseSensitive").asBoolean());
        }
        return map;
    }

    private Map<String, Object> baseExerciseMap(ResQuestionDTO question, String type) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", question.getId().toString());
        map.put("type", type);

        Map<String, String> prompt = new LinkedHashMap<>();
        prompt.put("text", question.getPromptText());
        prompt.put("lang", question.getPromptLang() != null ? question.getPromptLang() : "en");
        map.put("prompt", prompt);

        if (question.getExplanation() != null && !question.getExplanation().isBlank()) {
            map.put("explanation", question.getExplanation());
        }
        return map;
    }
}
