package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.request.ReqGenerateReadingSectionDTO;
import com.courseenglish.api.domain.request.ReqParseReadingBlockDTO;
import com.courseenglish.api.domain.response.ResParseReadingBlockDTO;
import com.courseenglish.api.service.ai.question.dto.AiQuestionGenMetaDTO;
import com.courseenglish.api.service.ai.question.AiQuestionGenResultValidator;
import com.courseenglish.api.service.ai.question.dto.AiDraftQuestionDTO;
import com.courseenglish.api.service.ai.question.dto.AiQuestionGenEnvelopeDTO;
import com.courseenglish.api.service.impl.OpenRouterClient;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AiReadingImportService {

  private static final int MAX_PASSAGES = 5;

  private final AiAccessSupport aiAccessSupport;
  private final OpenRouterClient openRouterClient;
  private final ObjectMapper objectMapper;
  private final AiQuestionGenResultValidator resultValidator;

  @Value("${app.ai.question-gen-model:anthropic/claude-3.5-sonnet}")
  private String questionGenModel;

  public AiReadingImportService(
      AiAccessSupport aiAccessSupport,
      OpenRouterClient openRouterClient,
      ObjectMapper objectMapper,
      AiQuestionGenResultValidator resultValidator) {
    this.aiAccessSupport = aiAccessSupport;
    this.openRouterClient = openRouterClient;
    this.objectMapper = objectMapper;
    this.resultValidator = resultValidator;
  }

  public ResParseReadingBlockDTO parseReadingBlock(ReqParseReadingBlockDTO request) throws IdInvalidException {
    aiAccessSupport.requireAiEnabled();
    aiAccessSupport.requireStaffUser();

    String raw = request.getRawText() == null ? "" : request.getRawText().trim();
    if (raw.length() < 80) {
      throw new IdInvalidException("Nội dung Reading quá ngắn");
    }

    String expectedRule = "";
    if (request.getExpectedSubQuestionCounts() != null && !request.getExpectedSubQuestionCounts().isEmpty()) {
      expectedRule =
          "Expected sub-question counts per passage: "
              + request.getExpectedSubQuestionCounts()
              + ". Follow this distribution when possible.\n";
    }

    String systemPrompt =
        """
            You parse English READING blocks into strict JSON for an LMS.
            Keep original meaning and numbering as much as possible.
            Output ONLY valid JSON:
            {
              "schemaVersion": 1,
              "questions": [
                {
                  "questionType": "READING_COMPREHENSION",
                  "promptText": "Passage title or short label",
                  "promptLang": "en",
                  "contentJson": {
                    "passage": { "title": "", "text": "..." },
                    "subQuestions": [
                      {
                        "id": "sq1",
                        "promptText": "...",
                        "promptLang": "en",
                        "choices": [
                          {"choiceKey":"a","choiceText":"...","correct":false},
                          {"choiceKey":"b","choiceText":"...","correct":true},
                          {"choiceKey":"c","choiceText":"...","correct":false},
                          {"choiceKey":"d","choiceText":"...","correct":false}
                        ]
                      }
                    ]
                  }
                }
              ],
              "meta": { "generationMode": "reading_import_parse" }
            }

            Rules:
            - Split into separate top-level READING_COMPREHENSION items by passage/question-group.
            - Do NOT merge unrelated passages.
            - Keep each passage text in contentJson.passage.text.
            - Keep options A/B/C/D per sub-question; mark correct=true only when answer key is present.
            - If answer key is missing, choose best guess but still return one correct=true.
            - Never output markdown.
            """;

    String userPrompt =
        """
            Parse the following reading block:
            %s

            ---
            %s
            ---
            """
            .formatted(expectedRule, raw);

    OpenRouterClient.ChatResult chat =
        openRouterClient.chatJson(
            questionGenModel,
            List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)));

    AiQuestionGenEnvelopeDTO envelope;
    try {
      envelope = objectMapper.readValue(chat.getContent(), AiQuestionGenEnvelopeDTO.class);
    } catch (Exception e) {
      throw new IdInvalidException("AI parse Reading trả JSON không hợp lệ");
    }

    if (envelope.getQuestions() == null) {
      envelope.setQuestions(new ArrayList<>());
    }
    for (AiDraftQuestionDTO q : envelope.getQuestions()) {
      q.setQuestionType(QuestionTypeEnum.READING_COMPREHENSION);
    }
    resultValidator.normalizeAndValidate(envelope, "en", 2);

    List<String> warnings = new ArrayList<>();
    if (request.getExpectedSubQuestionCounts() != null && !request.getExpectedSubQuestionCounts().isEmpty()) {
      List<Integer> actual = envelope.getQuestions().stream().map(this::countSubQuestions).toList();
      if (!actual.equals(request.getExpectedSubQuestionCounts())) {
        warnings.add("Số câu mỗi passage lệch kỳ vọng. Kỳ vọng=" + request.getExpectedSubQuestionCounts() + ", thực tế=" + actual);
      }
    }

    ResParseReadingBlockDTO response = new ResParseReadingBlockDTO();
    response.setEnvelope(envelope);
    response.setWarnings(warnings);
    return response;
  }

  public ResParseReadingBlockDTO generateReadingFromPrompt(ReqGenerateReadingSectionDTO request)
      throws IdInvalidException {
    aiAccessSupport.requireAiEnabled();
    aiAccessSupport.requireStaffUser();

    List<Integer> subCounts = normalizeSubQuestionCounts(request.getSubQuestionCounts());
    int difficulty = request.getDifficulty() != null ? request.getDifficulty() : 2;
    String promptLang = request.getPromptLang() != null ? request.getPromptLang() : "en";

    String topicBrief = buildTopicBrief(request.getPrompt(), request.getGrade(), request.getLanguageLevel());
    String distributionRule = buildDistributionRule(subCounts);
    String instructionRule = "";
    if (request.getSectionInstruction() != null && !request.getSectionInstruction().isBlank()) {
      instructionRule =
          "Section instruction for students (follow when writing stems):\n"
              + request.getSectionInstruction().trim()
              + "\n";
    }

    String systemPrompt =
        """
            You are an expert English reading comprehension author for a language center.
            Create ORIGINAL passages and MCQ sub-questions from the topic brief.
            Output ONLY valid JSON:
            {
              "schemaVersion": 1,
              "questions": [
                {
                  "questionType": "READING_COMPREHENSION",
                  "promptText": "Short passage title",
                  "promptLang": "en",
                  "contentJson": {
                    "passage": { "title": "", "text": "..." },
                    "subQuestions": [
                      {
                        "id": "sq1",
                        "promptText": "...",
                        "promptLang": "en",
                        "choices": [
                          {"choiceKey":"a","choiceText":"...","correct":false},
                          {"choiceKey":"b","choiceText":"...","correct":true},
                          {"choiceKey":"c","choiceText":"...","correct":false},
                          {"choiceKey":"d","choiceText":"...","correct":false}
                        ],
                        "explanation": "..."
                      }
                    ]
                  }
                }
              ],
              "meta": { "generationMode": "reading_prompt_generate" }
            }

            Rules:
            - Generate exactly the requested number of passages with exact sub-question counts.
            - Each passage must be unique in focus/angle.
            - Sub-questions must be answerable from their passage only.
            - Use 4 choices A/B/C/D per sub-question with exactly one correct=true.
            - Do not reference an uploaded document.
            - Never output markdown.
            """;

    String userPrompt =
        """
            Topic brief:
            ---
            %s
            ---

            %s
            %s
            Difficulty (1-5): %d
            promptLang for stems: %s

            Return JSON only.
            """
            .formatted(topicBrief, instructionRule, distributionRule, difficulty, promptLang);

    OpenRouterClient.ChatResult chat =
        openRouterClient.chatJson(
            questionGenModel,
            List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)));

    AiQuestionGenEnvelopeDTO envelope;
    try {
      envelope = objectMapper.readValue(chat.getContent(), AiQuestionGenEnvelopeDTO.class);
    } catch (Exception e) {
      throw new IdInvalidException("AI sinh Reading trả JSON không hợp lệ");
    }

    if (envelope.getQuestions() == null) {
      envelope.setQuestions(new ArrayList<>());
    }
    for (AiDraftQuestionDTO q : envelope.getQuestions()) {
      q.setQuestionType(QuestionTypeEnum.READING_COMPREHENSION);
    }
    resultValidator.normalizeAndValidate(envelope, promptLang, difficulty);

    List<String> warnings = new ArrayList<>();
    List<Integer> actual = envelope.getQuestions().stream().map(this::countSubQuestions).toList();
    if (actual.size() != subCounts.size()) {
      warnings.add("Số passage lệch kỳ vọng. Kỳ vọng=" + subCounts.size() + " passage, thực tế=" + actual.size());
    }
    if (!actual.equals(subCounts)) {
      warnings.add("Số câu mỗi passage lệch kỳ vọng. Kỳ vọng=" + subCounts + ", thực tế=" + actual);
    }

    if (envelope.getMeta() == null) {
      envelope.setMeta(new AiQuestionGenMetaDTO());
    }
    envelope.getMeta().setGenerationMode("reading_prompt_generate");
    envelope.getMeta().setModel(questionGenModel);

    ResParseReadingBlockDTO response = new ResParseReadingBlockDTO();
    response.setEnvelope(envelope);
    response.setWarnings(warnings);
    return response;
  }

  private List<Integer> normalizeSubQuestionCounts(List<Integer> raw) throws IdInvalidException {
    if (raw == null || raw.isEmpty()) {
      return List.of(4);
    }
    List<Integer> out = new ArrayList<>();
    for (Integer value : raw) {
      if (value == null || value < 2 || value > 12) {
        throw new IdInvalidException("Mỗi passage cần từ 2 đến 12 câu hỏi con");
      }
      out.add(value);
    }
    if (out.size() > MAX_PASSAGES) {
      throw new IdInvalidException("Tối đa " + MAX_PASSAGES + " passage mỗi lần sinh");
    }
    return out;
  }

  private String buildDistributionRule(List<Integer> subCounts) {
    StringBuilder sb = new StringBuilder();
    sb.append("Generate exactly ").append(subCounts.size()).append(" READING_COMPREHENSION passage(s).\n");
    for (int i = 0; i < subCounts.size(); i++) {
      sb.append("- Passage ").append(i + 1).append(": exactly ").append(subCounts.get(i)).append(" sub-questions.\n");
    }
    return sb.toString().trim();
  }

  private String buildTopicBrief(String prompt, Integer grade, String languageLevel) {
    StringBuilder sb = new StringBuilder();
    sb.append("Topic / creative brief:\n").append(prompt.trim()).append('\n');
    if (grade != null) {
      sb.append("Grade: ").append(grade).append('\n');
    }
    if (languageLevel != null && !languageLevel.isBlank()) {
      sb.append("Language level: ").append(languageLevel.trim()).append('\n');
    }
    return sb.toString().trim();
  }

  private int countSubQuestions(AiDraftQuestionDTO draft) {
    if (draft.getContentJson() == null || draft.getContentJson().get("subQuestions") == null) {
      return 0;
    }
    return draft.getContentJson().get("subQuestions").size();
  }
}

