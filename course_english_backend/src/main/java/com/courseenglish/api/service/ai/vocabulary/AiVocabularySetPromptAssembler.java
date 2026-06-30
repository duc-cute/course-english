package com.courseenglish.api.service.ai.vocabulary;

import com.courseenglish.api.domain.request.ReqCreateVocabularySetGenTaskDTO;
import org.springframework.stereotype.Component;

@Component
public class AiVocabularySetPromptAssembler {

  private static final String SYSTEM_PROMPT =
      """
      You are an English vocabulary author for Vietnamese learners.
      Return ONLY a single JSON object (no markdown, no commentary) with this exact shape:
      {
        "title": "string — concise Vietnamese or bilingual set title",
        "description": "string — 1-2 sentences in Vietnamese describing the set",
        "coverImagePrompt": "string — English prompt for a flat educational cover illustration (no text in image)",
        "items": [
          {
            "wordEn": "English word or phrase",
            "meaningVi": "Vietnamese meaning",
            "partOfSpeech": "noun|verb|adjective|adverb|phrase|preposition|conjunction",
            "exampleSentence": "One short English example using the word in topic context"
          }
        ]
      }
      Rules:
      - items.length MUST equal the requested word count exactly.
      - Each wordEn must be unique (case-insensitive).
      - Prefer practical words/phrases for the given topic and CEFR/level.
      - meaningVi: short, accurate Vietnamese (noun phrase or brief gloss).
      - partOfSpeech: include when confident; omit or null if unsure.
      - exampleSentence: one natural English sentence; must contain wordEn (or inflected form).
      - coverImagePrompt: vivid scene matching the set topic; flat/minimal style; NO text/letters in image.
      - Do NOT include phonetic or per-word images.
      - title and description must be non-empty.
      """;

  public String buildSystemPrompt() {
    return SYSTEM_PROMPT;
  }

  public String buildUserPrompt(ReqCreateVocabularySetGenTaskDTO request) {
    StringBuilder sb = new StringBuilder();
    sb.append("Create a vocabulary set with exactly ").append(request.getWordCount()).append(" items.\n");
    sb.append("Topic / requirements: ").append(request.getTopicPrompt().trim()).append("\n");

    if (request.getLanguageLevel() != null && !request.getLanguageLevel().isBlank()) {
      sb.append("Learner level: ").append(request.getLanguageLevel().trim()).append("\n");
    }
    if (request.getTitleHint() != null && !request.getTitleHint().isBlank()) {
      sb.append("Preferred title (adapt if needed): ").append(request.getTitleHint().trim()).append("\n");
    }
    if (request.getAdditionalInstructions() != null && !request.getAdditionalInstructions().isBlank()) {
      sb.append("Additional instructions: ").append(request.getAdditionalInstructions().trim()).append("\n");
    }
    if (!request.isGenerateCover()) {
      sb.append("Omit coverImagePrompt or set it to null.\n");
    }

    sb.append("\nReturn JSON only.");
    return sb.toString();
  }
}
