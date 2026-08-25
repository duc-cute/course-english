package com.courseenglish.api.service.exam;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

/**
 * Strip correct answers from ExerciseSetPayload JSON before sending to students mid-exam.
 */
@Component
public class ExamPaperAnswerRedactor {

    private final ObjectMapper objectMapper;

    public ExamPaperAnswerRedactor(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String redactPayloadJson(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return payloadJson;
        }
        try {
            JsonNode root = objectMapper.readTree(payloadJson);
            if (!(root instanceof ObjectNode obj)) {
                return payloadJson;
            }
            JsonNode questions = obj.get("questions");
            if (questions instanceof ArrayNode arr) {
                for (JsonNode q : arr) {
                    if (q instanceof ObjectNode qObj) {
                        redactQuestion(qObj);
                    }
                }
            }
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return payloadJson;
        }
    }

    private void redactQuestion(ObjectNode q) {
        q.remove("explanation");
        JsonNode content = q.get("contentJson");
        if (content instanceof ObjectNode contentObj) {
            redactContentJson(contentObj);
        }
        // Some payloads nest choices at top level
        redactChoicesArray(q.get("choices"));
        JsonNode blanks = q.get("blanks");
        if (blanks instanceof ArrayNode blankArr) {
            for (JsonNode blank : blankArr) {
                if (blank instanceof ObjectNode b) {
                    b.remove("acceptedAnswers");
                    redactChoicesArray(b.get("choices"));
                }
            }
        }
        JsonNode subQuestions = q.get("subQuestions");
        if (subQuestions instanceof ArrayNode subs) {
            for (JsonNode sub : subs) {
                if (sub instanceof ObjectNode s) {
                    s.remove("explanation");
                    redactChoicesArray(s.get("choices"));
                }
            }
        }
    }

    private void redactContentJson(ObjectNode content) {
        redactChoicesArray(content.get("choices"));
        JsonNode blanks = content.get("blanks");
        if (blanks instanceof ArrayNode blankArr) {
            for (JsonNode blank : blankArr) {
                if (blank instanceof ObjectNode b) {
                    b.remove("acceptedAnswers");
                    redactChoicesArray(b.get("choices"));
                }
            }
        }
        JsonNode pairs = content.get("pairs");
        // matching: leave prompts, strip answer keys if present
        if (pairs instanceof ArrayNode) {
            // no-op for structure; FE scores client-side for Wave 2
        }
        JsonNode subQuestions = content.get("subQuestions");
        if (subQuestions instanceof ArrayNode subs) {
            for (JsonNode sub : subs) {
                if (sub instanceof ObjectNode s) {
                    s.remove("explanation");
                    redactChoicesArray(s.get("choices"));
                }
            }
        }
    }

    private void redactChoicesArray(JsonNode choicesNode) {
        if (!(choicesNode instanceof ArrayNode choices)) {
            return;
        }
        for (JsonNode choice : choices) {
            if (choice instanceof ObjectNode c) {
                c.remove("correct");
                c.put("correct", false);
            }
        }
    }
}
