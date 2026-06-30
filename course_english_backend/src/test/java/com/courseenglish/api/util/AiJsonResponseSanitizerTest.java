package com.courseenglish.api.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AiJsonResponseSanitizerTest {

    @Test
    void extractsPlainJsonObject() {
        String raw = "{\"schemaVersion\":1,\"questions\":[]}";
        assertEquals(raw, AiJsonResponseSanitizer.extractJsonObject(raw));
    }

    @Test
    void stripsJsonFence() {
        String raw = "```json\n{\"a\":1}\n```";
        assertEquals("{\"a\":1}", AiJsonResponseSanitizer.extractJsonObject(raw));
    }

    @Test
    void stripsPlainFence() {
        String raw = "```\n{\"a\":1}\n```";
        assertEquals("{\"a\":1}", AiJsonResponseSanitizer.extractJsonObject(raw));
    }

    @Test
    void stripsLeadingProseAndFence() {
        String raw = "Here is the JSON:\n```json\n{\"a\":1}\n```";
        assertEquals("{\"a\":1}", AiJsonResponseSanitizer.extractJsonObject(raw));
    }

    @Test
    void extractsObjectFromProseWithoutFence() {
        String raw = "Sure! {\"a\":1} Hope this helps.";
        assertEquals("{\"a\":1}", AiJsonResponseSanitizer.extractJsonObject(raw));
    }

    @Test
    void repairsUnescapedQuotesInExplanationField() throws Exception {
        String broken =
                """
                {"questions":[{"questionType":"MULTIPLE_CHOICE","explanation":"Nên đáp án đúng là "goes" vì she","choices":[]}]}
                """;
        String repaired = AiJsonResponseSanitizer.repairUnescapedQuotesInField(broken, "explanation");
        var root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(repaired);
        assertEquals(
                "Nên đáp án đúng là \"goes\" vì she",
                root.path("questions").path(0).path("explanation").asText());
    }
}
