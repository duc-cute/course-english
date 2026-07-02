package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.request.ReqStoryCoverPreviewDTO;
import org.springframework.stereotype.Component;

@Component
public class StoryCoverPromptAssembler {

    private static final int MAX_STORY_CHARS = 6000;

    private static final String SYSTEM_PROMPT =
            """
            You are an art director for English learning story covers.
            Read the story metadata and full text, then return ONLY one JSON object (no markdown):
            {
              "coverImagePrompt": "string — rich English prompt for image generation (80-180 words)",
              "scene": "string — main setting in one sentence",
              "subjects": "string — key characters/objects to show",
              "mood": "string — emotional tone",
              "palette": "string — color palette suggestion",
              "composition": "string — framing for wide 16:9 cover"
            }
            Rules for coverImagePrompt:
            - Describe a cinematic wide 16:9 story cover with depth, atmosphere, and clear focal subject.
            - Base details on the ACTUAL story content (setting, characters, conflict, climax imagery).
            - Educational storybook / illustrated novel style — inviting for language learners.
            - NO text, NO letters, NO words, NO logos, NO watermarks in the image.
            - Avoid generic stock imagery; be specific to this story's world.
            """;

    public String buildSystemPrompt() {
        return SYSTEM_PROMPT;
    }

    public String buildUserPrompt(ReqStoryCoverPreviewDTO request) {
        StringBuilder sb = new StringBuilder();
        sb.append("Design a story cover image prompt from this English learning story.\n\n");
        sb.append("Title: ").append(request.getTitle().trim()).append("\n");
        if (request.getLevel() != null && !request.getLevel().isBlank()) {
            sb.append("CEFR level: ").append(request.getLevel().trim()).append("\n");
        }
        if (request.getPrompt() != null && !request.getPrompt().isBlank()) {
            sb.append("Author's original creative prompt: ").append(request.getPrompt().trim()).append("\n");
        }
        sb.append("\nFull story text:\n");
        sb.append(truncateStory(request.getContent()));
        sb.append("\n\nReturn JSON only.");
        return sb.toString();
    }

    private static String truncateStory(String content) {
        if (content == null) {
            return "";
        }
        String trimmed = content.trim();
        if (trimmed.length() <= MAX_STORY_CHARS) {
            return trimmed;
        }
        return trimmed.substring(0, MAX_STORY_CHARS) + "\n...[truncated]";
    }
}
