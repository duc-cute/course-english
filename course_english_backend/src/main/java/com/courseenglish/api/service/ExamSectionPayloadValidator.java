package com.courseenglish.api.service;

import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public class ExamSectionPayloadValidator {

    private final ObjectMapper objectMapper;

    public ExamSectionPayloadValidator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void validatePayloadJson(String payloadJson) throws IdInvalidException {
        if (payloadJson == null || payloadJson.isBlank()) {
            throw new IdInvalidException("payloadJson không được để trống");
        }
        try {
            JsonNode root = objectMapper.readTree(payloadJson);
            if (root == null || !root.isObject()) {
                throw new IdInvalidException("payloadJson phải là JSON object");
            }
            JsonNode questions = root.get("questions");
            if (questions == null || !questions.isArray()) {
                throw new IdInvalidException("payloadJson phải có mảng questions");
            }
        } catch (IdInvalidException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IdInvalidException("payloadJson không hợp lệ: " + ex.getMessage());
        }
    }

    public int countQuestions(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return 0;
        }
        try {
            JsonNode root = objectMapper.readTree(payloadJson);
            JsonNode questions = root.get("questions");
            if (questions == null || !questions.isArray()) {
                return 0;
            }
            return questions.size();
        } catch (Exception ignored) {
            return 0;
        }
    }

    public void validateQuestionTypeConsistency(QuestionTypeEnum expectedType, String payloadJson)
            throws IdInvalidException {
        if (expectedType == null || payloadJson == null || payloadJson.isBlank()) {
            return;
        }
        try {
            JsonNode root = objectMapper.readTree(payloadJson);
            JsonNode questions = root.get("questions");
            if (questions == null || !questions.isArray()) {
                return;
            }
            for (JsonNode question : questions) {
                if (question == null || question.isNull()) {
                    continue;
                }
                String type = question.path("type").asText("");
                if (!type.isBlank() && !expectedType.name().equals(type)) {
                    throw new IdInvalidException(
                            "Câu hỏi loại " + type + " không khớp questionType của section (" + expectedType + ")");
                }
            }
        } catch (IdInvalidException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IdInvalidException("Không thể kiểm tra questionType: " + ex.getMessage());
        }
    }
}
