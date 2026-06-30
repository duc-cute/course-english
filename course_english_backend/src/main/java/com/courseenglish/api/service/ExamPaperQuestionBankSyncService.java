package com.courseenglish.api.service;

import com.courseenglish.api.domain.ExamPaper;
import com.courseenglish.api.domain.ExamSection;
import com.courseenglish.api.domain.request.ReqQuestionChoiceDTO;
import com.courseenglish.api.domain.request.ReqQuestionDTO;
import com.courseenglish.api.domain.response.ResQuestionDTO;
import com.courseenglish.api.repository.ExamSectionRepository;
import com.courseenglish.api.util.constant.ExamPaperStatusEnum;
import com.courseenglish.api.util.constant.QuestionSourceEnum;
import com.courseenglish.api.util.constant.QuestionStatusEnum;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Khi lưu đề thi, đồng bộ câu hỏi inline trong section payload vào Question Bank.
 * Mỗi câu trong payload có thể gắn {@code bankQuestionId} để lần sau update thay vì tạo mới.
 */
@Service
public class ExamPaperQuestionBankSyncService {

    private static final Logger log = LoggerFactory.getLogger(ExamPaperQuestionBankSyncService.class);

    static final String BANK_QUESTION_ID_FIELD = "bankQuestionId";

    private static final Set<QuestionTypeEnum> SUPPORTED_TYPES = Set.of(
            QuestionTypeEnum.MULTIPLE_CHOICE,
            QuestionTypeEnum.TRUE_FALSE,
            QuestionTypeEnum.FILL_BLANK
    );

    private final ExamSectionRepository examSectionRepository;
    private final QuestionService questionService;
    private final ObjectMapper objectMapper;

    public ExamPaperQuestionBankSyncService(
            ExamSectionRepository examSectionRepository,
            QuestionService questionService,
            ObjectMapper objectMapper) {
        this.examSectionRepository = examSectionRepository;
        this.questionService = questionService;
        this.objectMapper = objectMapper;
    }

    public int syncExamPaper(ExamPaper paper) {
        if (paper == null || paper.getId() == null) {
            return 0;
        }
        List<ExamSection> sections = examSectionRepository
                .findByExamPaper_IdAndVoidedFalseOrderByDisplayOrderAsc(paper.getId());
        int synced = 0;
        for (ExamSection section : sections) {
            synced += syncSection(paper, section);
        }
        return synced;
    }

    private int syncSection(ExamPaper paper, ExamSection section) {
        String payloadJson = section.getPayloadJson();
        if (payloadJson == null || payloadJson.isBlank()) {
            return 0;
        }
        try {
            ObjectNode root = (ObjectNode) objectMapper.readTree(payloadJson);
            JsonNode questionsNode = root.get("questions");
            if (questionsNode == null || !questionsNode.isArray()) {
                return 0;
            }
            ArrayNode questions = (ArrayNode) questionsNode;
            int synced = 0;
            boolean payloadChanged = false;

            for (int i = 0; i < questions.size(); i++) {
                JsonNode questionNode = questions.get(i);
                if (questionNode == null || !questionNode.isObject()) {
                    continue;
                }
                try {
                    UUID bankId = upsertQuestionFromExerciseNode(paper, section, questionNode);
                    if (bankId != null) {
                        synced++;
                        String existing = questionNode.path(BANK_QUESTION_ID_FIELD).asText("");
                        if (!bankId.toString().equals(existing)) {
                            ((ObjectNode) questionNode).put(BANK_QUESTION_ID_FIELD, bankId.toString());
                            payloadChanged = true;
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Skip bank sync for exam {} section {} question[{}]: {}",
                            paper.getId(), section.getId(), i, ex.getMessage());
                }
            }

            if (payloadChanged) {
                section.setPayloadJson(objectMapper.writeValueAsString(root));
                examSectionRepository.save(section);
            }
            return synced;
        } catch (Exception ex) {
            log.warn("Failed to sync section {} to question bank: {}", section.getId(), ex.getMessage());
            return 0;
        }
    }

    private UUID upsertQuestionFromExerciseNode(ExamPaper paper, ExamSection section, JsonNode questionNode)
            throws IdInvalidException {
        QuestionTypeEnum type = resolveType(questionNode, section);
        if (type == null || !SUPPORTED_TYPES.contains(type)) {
            return null;
        }

        ReqQuestionDTO dto = toQuestionDto(paper, section, questionNode, type);
        if (dto == null) {
            return null;
        }

        UUID existingBankId = parseUuid(questionNode.path(BANK_QUESTION_ID_FIELD).asText(null));
        if (existingBankId != null) {
            try {
                ResQuestionDTO updated = questionService.update(existingBankId, dto);
                return updated.getId();
            } catch (IdInvalidException ex) {
                log.debug("bankQuestionId {} invalid, creating new: {}", existingBankId, ex.getMessage());
            }
        }

        ResQuestionDTO created = questionService.create(dto);
        return created.getId();
    }

    private QuestionTypeEnum resolveType(JsonNode questionNode, ExamSection section) {
        String raw = questionNode.path("type").asText("");
        if (raw.isBlank() && section.getQuestionType() != null) {
            return section.getQuestionType();
        }
        if (raw.isBlank()) {
            return null;
        }
        try {
            return QuestionTypeEnum.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private ReqQuestionDTO toQuestionDto(
            ExamPaper paper,
            ExamSection section,
            JsonNode questionNode,
            QuestionTypeEnum type) {
        JsonNode prompt = questionNode.get("prompt");
        String promptText = prompt != null ? prompt.path("text").asText("").trim() : "";
        if (promptText.isBlank()) {
            return null;
        }

        ReqQuestionDTO dto = new ReqQuestionDTO();
        dto.setQuestionType(type);
        dto.setPromptText(promptText);
        dto.setPromptLang(prompt != null ? prompt.path("lang").asText("en") : "en");
        dto.setExplanation(nullableText(questionNode.get("explanation")));
        dto.setSource(QuestionSourceEnum.EXAM);
        dto.setStatus(mapExamStatusToQuestionStatus(paper.getStatus()));
        dto.setTopic(trimToNull(section.getTitle()));

        List<String> tags = new ArrayList<>();
        tags.add("exam-paper:" + paper.getId());
        if (paper.getTitle() != null && !paper.getTitle().isBlank()) {
            tags.add("exam:" + paper.getTitle().trim());
        }
        dto.setTags(tags);

        if (type == QuestionTypeEnum.MULTIPLE_CHOICE) {
            dto.setChoices(buildMcqChoices(questionNode));
            if (dto.getChoices() == null || dto.getChoices().size() < 2) {
                return null;
            }
        } else if (type == QuestionTypeEnum.TRUE_FALSE) {
            JsonNode correctAnswer = questionNode.get("correctAnswer");
            if (correctAnswer == null || !correctAnswer.isBoolean()) {
                return null;
            }
            ObjectNode content = objectMapper.createObjectNode();
            content.put("correctAnswer", correctAnswer.asBoolean());
            dto.setContentJson(content.toString());
        } else if (type == QuestionTypeEnum.FILL_BLANK) {
            JsonNode blanks = questionNode.get("blanks");
            if (blanks == null || !blanks.isArray() || blanks.isEmpty()) {
                return null;
            }
            ObjectNode content = objectMapper.createObjectNode();
            content.set("blanks", blanks.deepCopy());
            if (questionNode.has("caseSensitive") && questionNode.get("caseSensitive").isBoolean()) {
                content.put("caseSensitive", questionNode.get("caseSensitive").asBoolean());
            }
            dto.setContentJson(content.toString());
        }

        return dto;
    }

    private List<ReqQuestionChoiceDTO> buildMcqChoices(JsonNode questionNode) {
        JsonNode choices = questionNode.get("choices");
        String correctId = questionNode.path("correctChoiceId").asText("");
        if (choices == null || !choices.isArray()) {
            return List.of();
        }
        List<ReqQuestionChoiceDTO> result = new ArrayList<>();
        int order = 0;
        for (JsonNode choice : choices) {
            if (choice == null || !choice.isObject()) {
                continue;
            }
            String key = choice.path("id").asText("").trim().toLowerCase();
            String text = choice.path("text").asText("").trim();
            if (key.isBlank() || text.isBlank()) {
                continue;
            }
            ReqQuestionChoiceDTO item = new ReqQuestionChoiceDTO();
            item.setChoiceKey(key);
            item.setChoiceText(text);
            item.setCorrect(key.equals(correctId.trim().toLowerCase()));
            item.setDisplayOrder(order++);
            result.add(item);
        }
        return result;
    }

    private QuestionStatusEnum mapExamStatusToQuestionStatus(ExamPaperStatusEnum examStatus) {
        if (examStatus == ExamPaperStatusEnum.PUBLISHED) {
            return QuestionStatusEnum.PUBLISHED;
        }
        if (examStatus == ExamPaperStatusEnum.ARCHIVED) {
            return QuestionStatusEnum.ARCHIVED;
        }
        return QuestionStatusEnum.DRAFT;
    }

    private static UUID parseUuid(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static String nullableText(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        String text = node.asText("").trim();
        return text.isEmpty() ? null : text;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
