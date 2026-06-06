package com.courseenglish.api.service;

import com.courseenglish.api.domain.response.ResLessonBlockDTO;
import com.courseenglish.api.util.constant.LessonBlockTypeEnum;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class QuestionRefResolverService {

    private final QuestionService questionService;
    private final ObjectMapper objectMapper;

    public QuestionRefResolverService(QuestionService questionService, ObjectMapper objectMapper) {
        this.questionService = questionService;
        this.objectMapper = objectMapper;
    }

    public void resolve(List<ResLessonBlockDTO> blocks) {
        if (blocks == null || blocks.isEmpty()) {
            return;
        }
        for (ResLessonBlockDTO block : blocks) {
            if (block.getBlockType() != LessonBlockTypeEnum.QUESTION_REF) {
                continue;
            }
            List<UUID> refs = parseRefs(block.getPayloadJson());
            block.setResolvedQuestionsJson(questionService.buildResolvedQuestionsJson(refs, true));
        }
    }

    private List<UUID> parseRefs(String payloadJson) {
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
}
