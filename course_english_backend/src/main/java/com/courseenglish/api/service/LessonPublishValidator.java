package com.courseenglish.api.service;

import com.courseenglish.api.domain.LessonBlock;
import com.courseenglish.api.domain.VocabularySet;
import com.courseenglish.api.repository.LessonBlockRepository;
import com.courseenglish.api.repository.VocabularySetMemberRepository;
import com.courseenglish.api.repository.VocabularySetRepository;
import com.courseenglish.api.util.constant.LessonBlockTypeEnum;
import com.courseenglish.api.util.constant.VocabularySetStatusEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class LessonPublishValidator {

    private final LessonBlockRepository lessonBlockRepository;
    private final QuestionService questionService;
    private final VocabularySetRepository vocabularySetRepository;
    private final VocabularySetMemberRepository vocabularySetMemberRepository;
    private final ObjectMapper objectMapper;

    public LessonPublishValidator(
            LessonBlockRepository lessonBlockRepository,
            QuestionService questionService,
            VocabularySetRepository vocabularySetRepository,
            VocabularySetMemberRepository vocabularySetMemberRepository,
            ObjectMapper objectMapper) {
        this.lessonBlockRepository = lessonBlockRepository;
        this.questionService = questionService;
        this.vocabularySetRepository = vocabularySetRepository;
        this.vocabularySetMemberRepository = vocabularySetMemberRepository;
        this.objectMapper = objectMapper;
    }

    public void validateForPublish(UUID lessonId) throws IdInvalidException {
        List<LessonBlock> blocks = lessonBlockRepository
                .findByLesson_IdAndVoidedFalseOrderByDisplayOrderAsc(lessonId);

        if (blocks.isEmpty()) {
            throw new IdInvalidException("Không thể publish: bài học chưa có khối nội dung nào.");
        }

        List<String> errors = new ArrayList<>();
        int index = 1;
        for (LessonBlock block : blocks) {
            validateBlock(block, index++, errors);
        }

        if (!errors.isEmpty()) {
            throw new IdInvalidException("Không thể publish bài học:\n" + String.join("\n", errors));
        }
    }

    private void validateBlock(LessonBlock block, int index, List<String> errors) {
        LessonBlockTypeEnum type = block.getBlockType();
        if (type == null) {
            errors.add(blockMessage(index, "UNKNOWN", "thiếu loại khối"));
            return;
        }

        switch (type) {
            case QUESTION_REF -> validateQuestionRef(block, index, errors);
            case EXERCISE_SET -> validateExerciseSet(block, index, errors);
            case VOCABULARY -> validateVocabulary(block, index, errors);
            case SUMMARY -> validateSummary(block, index, errors);
            case CALLOUT -> validateCallout(block, index, errors);
            default -> {
                // TEXT, IMAGE, … — không chặn publish
            }
        }
    }

    private void validateQuestionRef(LessonBlock block, int index, List<String> errors) {
        List<UUID> refs = parseQuestionRefs(block.getPayloadJson());
        if (refs.isEmpty()) {
            errors.add(blockMessage(index, "QUESTION_REF",
                    "chưa chọn câu hỏi từ ngân hàng (refs trống)"));
            return;
        }

        int resolvedCount = questionService.findByIdsOrdered(refs, true).size();
        if (resolvedCount < refs.size()) {
            errors.add(blockMessage(index, "QUESTION_REF",
                    "có câu chưa publish hoặc không tồn tại trong ngân hàng ("
                            + resolvedCount + "/" + refs.size() + " câu hợp lệ)"));
        }
    }

    private void validateExerciseSet(LessonBlock block, int index, List<String> errors) {
        int validQuestions = countValidExerciseQuestions(block.getPayloadJson());
        if (validQuestions == 0) {
            errors.add(blockMessage(index, "EXERCISE_SET",
                    "chưa có câu hỏi hợp lệ (cần ít nhất 1 câu MCQ, nghe chọn hoặc ghép cặp)"));
        }
    }

    private void validateSummary(LessonBlock block, int index, List<String> errors) {
        int itemCount = countSummaryItems(block.getPayloadJson());
        if (itemCount == 0) {
            errors.add(blockMessage(index, "SUMMARY", "cần ít nhất một ý tóm tắt"));
        }
    }

    private void validateCallout(LessonBlock block, int index, List<String> errors) {
        if (!hasCalloutHtml(block.getPayloadJson())) {
            errors.add(blockMessage(index, "CALLOUT", "nội dung ghi chú không được để trống"));
        }
    }

    private void validateVocabulary(LessonBlock block, int index, List<String> errors) {
        UUID setId = parseVocabularySetId(block.getPayloadJson());
        if (setId == null) {
            errors.add(blockMessage(index, "VOCABULARY", "chưa chọn bộ từ vựng"));
            return;
        }

        Optional<VocabularySet> optional = vocabularySetRepository.findByIdAndVoidedFalse(setId);
        if (optional.isEmpty()) {
            errors.add(blockMessage(index, "VOCABULARY", "bộ từ vựng không tồn tại"));
            return;
        }

        VocabularySet set = optional.get();
        if (set.getStatus() != VocabularySetStatusEnum.PUBLISHED) {
            errors.add(blockMessage(index, "VOCABULARY",
                    "bộ từ \"" + safeLabel(set.getTitle()) + "\" chưa publish"));
            return;
        }

        long itemCount = vocabularySetMemberRepository.countByVocabularySet_IdAndVoidedFalse(setId);
        if (itemCount == 0) {
            errors.add(blockMessage(index, "VOCABULARY",
                    "bộ từ \"" + safeLabel(set.getTitle()) + "\" chưa có mục từ nào"));
        }
    }

    private String blockMessage(int index, String type, String detail) {
        return "Khối #" + index + " (" + type + "): " + detail;
    }

    private String safeLabel(String value) {
        if (value == null || value.isBlank()) {
            return "không tên";
        }
        return value.trim();
    }

    private List<UUID> parseQuestionRefs(String payloadJson) {
        List<UUID> refs = new ArrayList<>();
        if (payloadJson == null || payloadJson.isBlank()) {
            return refs;
        }
        try {
            JsonNode root = objectMapper.readTree(payloadJson);
            JsonNode refsNode = root.get("refs");
            if (refsNode == null || !refsNode.isArray()) {
                return refs;
            }
            for (JsonNode node : refsNode) {
                if (node == null || node.isNull()) {
                    continue;
                }
                String raw = node.asText();
                if (raw == null || raw.isBlank()) {
                    continue;
                }
                try {
                    refs.add(UUID.fromString(raw.trim()));
                } catch (IllegalArgumentException ignored) {
                    // skip invalid uuid
                }
            }
        } catch (Exception ignored) {
            return refs;
        }
        return refs;
    }

    private UUID parseVocabularySetId(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(payloadJson);
            JsonNode idNode = root.get("vocabularySetId");
            if (idNode == null || idNode.isNull()) {
                return null;
            }
            String raw = idNode.asText();
            if (raw == null || raw.isBlank()) {
                return null;
            }
            return UUID.fromString(raw.trim());
        } catch (Exception ignored) {
            return null;
        }
    }

    private int countValidExerciseQuestions(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return 0;
        }
        try {
            JsonNode root = objectMapper.readTree(payloadJson);
            JsonNode questionsNode = root.get("questions");
            if (questionsNode == null || !questionsNode.isArray()) {
                return 0;
            }
            int count = 0;
            for (JsonNode question : questionsNode) {
                if (isValidExerciseQuestion(question)) {
                    count++;
                }
            }
            return count;
        } catch (Exception ignored) {
            return 0;
        }
    }

    private boolean isValidExerciseQuestion(JsonNode question) {
        if (question == null || question.isNull()) {
            return false;
        }
        JsonNode typeNode = question.get("type");
        if (typeNode == null || typeNode.isNull()) {
            return false;
        }
        String type = typeNode.asText("");
        if ("MULTIPLE_CHOICE".equals(type)) {
            return isValidMcq(question);
        }
        if ("LISTEN_CHOOSE".equals(type)) {
            return isValidListenChoose(question);
        }
        if ("MATCHING".equals(type)) {
            return isValidMatching(question);
        }
        if ("SPELLING".equals(type)) {
            return isValidSpelling(question);
        }
        if ("LISTEN_TYPE".equals(type)) {
            return isValidListenType(question);
        }
        if ("FILL_BLANK".equals(type)) {
            return isValidFillBlank(question);
        }
        if ("REORDER_SENTENCE".equals(type)) {
            return isValidReorderSentence(question);
        }
        return false;
    }

    private boolean isValidMcq(JsonNode question) {
        JsonNode prompt = question.get("prompt");
        String promptText = prompt != null && prompt.isObject() ? prompt.path("text").asText("") : "";
        if (promptText.isBlank()) {
            return false;
        }
        JsonNode choices = question.get("choices");
        if (choices == null || !choices.isArray() || choices.isEmpty()) {
            return false;
        }
        String correctChoiceId = question.path("correctChoiceId").asText("");
        return !correctChoiceId.isBlank();
    }

    private int countSummaryItems(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return 0;
        }
        try {
            JsonNode root = objectMapper.readTree(payloadJson);
            JsonNode itemsNode = root.get("items");
            if (itemsNode == null || !itemsNode.isArray()) {
                return 0;
            }
            int count = 0;
            for (JsonNode item : itemsNode) {
                if (item != null && !item.isNull() && !item.asText("").isBlank()) {
                    count++;
                }
            }
            return count;
        } catch (Exception ignored) {
            return 0;
        }
    }

    private boolean hasCalloutHtml(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return false;
        }
        try {
            JsonNode root = objectMapper.readTree(payloadJson);
            String html = root.path("html").asText("").trim();
            return !html.isBlank() && !html.equals("<p><br></p>") && !html.equals("<p></p>");
        } catch (Exception ignored) {
            return false;
        }
    }

    private boolean isValidListenChoose(JsonNode question) {
        String audioUrl = question.path("audioUrl").asText("");
        if (audioUrl.isBlank()) {
            return false;
        }
        JsonNode choices = question.get("choices");
        if (choices == null || !choices.isArray() || choices.isEmpty()) {
            return false;
        }
        String correctChoiceId = question.path("correctChoiceId").asText("");
        return !correctChoiceId.isBlank();
    }

    private boolean isValidMatching(JsonNode question) {
        JsonNode pairs = question.get("pairs");
        if (pairs == null || !pairs.isArray() || pairs.isEmpty()) {
            return false;
        }
        for (JsonNode pair : pairs) {
            if (pair == null || pair.isNull()) {
                continue;
            }
            String left = pair.path("left").asText("");
            String right = pair.path("right").asText("");
            if (!left.isBlank() && !right.isBlank()) {
                return true;
            }
        }
        return false;
    }

    private boolean isValidSpelling(JsonNode question) {
        String correctAnswer = question.path("correctAnswer").asText("");
        if (correctAnswer.isBlank()) {
            return false;
        }
        JsonNode prompt = question.get("prompt");
        String promptText = prompt != null && prompt.isObject() ? prompt.path("text").asText("") : "";
        return !promptText.isBlank() || !question.path("wordEn").asText("").isBlank();
    }

    private boolean isValidListenType(JsonNode question) {
        String audioUrl = question.path("audioUrl").asText("");
        String correctAnswer = question.path("correctAnswer").asText("");
        return !audioUrl.isBlank() && !correctAnswer.isBlank();
    }

    private boolean isValidReorderSentence(JsonNode question) {
        JsonNode tokens = question.get("tokens");
        if (tokens == null || !tokens.isArray() || tokens.size() < 3) {
            return false;
        }
        java.util.Set<String> tokenIds = new java.util.HashSet<>();
        for (JsonNode token : tokens) {
            if (token == null || token.isNull()) {
                return false;
            }
            String id = token.path("id").asText("").trim();
            String text = token.path("text").asText("").trim();
            if (id.isBlank() || text.isBlank() || !tokenIds.add(id)) {
                return false;
            }
        }
        JsonNode correctOrder = question.get("correctOrder");
        if (correctOrder == null || !correctOrder.isArray() || correctOrder.size() != tokenIds.size()) {
            return false;
        }
        java.util.Set<String> orderIds = new java.util.HashSet<>();
        for (JsonNode idNode : correctOrder) {
            String id = idNode != null && !idNode.isNull() ? idNode.asText("").trim() : "";
            if (id.isBlank() || !tokenIds.contains(id) || !orderIds.add(id)) {
                return false;
            }
        }
        return orderIds.size() == tokenIds.size();
    }

    private boolean isValidFillBlank(JsonNode question) {
        JsonNode prompt = question.get("prompt");
        String promptText = prompt != null && prompt.isObject() ? prompt.path("text").asText("") : "";
        if (promptText.isBlank() || !promptText.contains("___")) {
            return false;
        }
        JsonNode blanks = question.get("blanks");
        if (blanks == null || !blanks.isArray() || blanks.isEmpty()) {
            return false;
        }
        for (JsonNode blank : blanks) {
            if (blank == null || blank.isNull()) {
                continue;
            }
            JsonNode accepted = blank.get("acceptedAnswers");
            if (accepted == null || !accepted.isArray() || accepted.isEmpty()) {
                return false;
            }
            boolean hasAnswer = false;
            for (JsonNode answer : accepted) {
                if (answer != null && !answer.isNull() && !answer.asText("").isBlank()) {
                    hasAnswer = true;
                    break;
                }
            }
            if (!hasAnswer) {
                return false;
            }
        }
        return true;
    }
}
