package com.courseenglish.api.service;

import com.courseenglish.api.domain.response.ResLessonBlockDTO;
import com.courseenglish.api.util.constant.LessonBlockTypeEnum;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class VocabularyBlockResolverService {

    private final VocabularySetService vocabularySetService;
    private final ObjectMapper objectMapper;

    public VocabularyBlockResolverService(
            VocabularySetService vocabularySetService,
            ObjectMapper objectMapper) {
        this.vocabularySetService = vocabularySetService;
        this.objectMapper = objectMapper;
    }

    public void resolve(List<ResLessonBlockDTO> blocks) {
        if (blocks == null || blocks.isEmpty()) {
            return;
        }
        for (ResLessonBlockDTO block : blocks) {
            if (block.getBlockType() != LessonBlockTypeEnum.VOCABULARY) {
                continue;
            }
            UUID setId = parseVocabularySetId(block.getPayloadJson());
            block.setResolvedVocabularyJson(
                    vocabularySetService.buildResolvedVocabularyJson(setId, true));
        }
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
}
