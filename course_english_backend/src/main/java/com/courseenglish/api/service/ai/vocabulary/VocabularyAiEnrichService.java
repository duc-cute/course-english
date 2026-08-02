package com.courseenglish.api.service.ai.vocabulary;

import com.courseenglish.api.domain.VocabularyWord;
import com.courseenglish.api.domain.response.ResVocabularyAiEnrichResultDTO;
import com.courseenglish.api.integration.speech.model.SpeechGenerationRequest;
import com.courseenglish.api.integration.speech.model.SpeechResult;
import com.courseenglish.api.integration.speech.service.SpeechGenerationService;
import com.courseenglish.api.repository.VocabularyWordRepository;
import com.courseenglish.api.service.impl.OpenRouterClient;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Fill missing IPA via AI (no overwrite) and missing audio via Edge TTS.
 */
@Service
public class VocabularyAiEnrichService {

    private static final Logger log = LoggerFactory.getLogger(VocabularyAiEnrichService.class);

    private static final String IPA_SYSTEM_PROMPT =
            """
            You are an English pronunciation assistant for Vietnamese learners.
            Return ONLY one JSON object (no markdown):
            {
              "items": [
                { "wordEn": "exact input word", "phonetic": "/ˈæp.əl/" }
              ]
            }
            Rules:
            - Provide British IPA for every input word/phrase.
            - phonetic MUST use slash notation, e.g. "/ˈsəʊ.lə ˈpaʊə/".
            - Keep wordEn exactly as given (same spelling/casing).
            - items.length MUST equal the number of input words.
            """;

    private final OpenRouterClient openRouterClient;
    private final ObjectMapper objectMapper;
    private final VocabularyWordRepository wordRepository;
    private final SpeechGenerationService speechGenerationService;

    @Value("${app.ai.enabled:true}")
    private boolean aiEnabled;

    @Value("${app.ai.vocab-ai-enrich.model:${app.ai.vocab-set-gen-model}}")
    private String enrichModel;

    @Value("${app.ai.vocab-ai-enrich.timeout-sec:90}")
    private long enrichTimeoutSec;

    public VocabularyAiEnrichService(
            OpenRouterClient openRouterClient,
            ObjectMapper objectMapper,
            VocabularyWordRepository wordRepository,
            SpeechGenerationService speechGenerationService) {
        this.openRouterClient = openRouterClient;
        this.objectMapper = objectMapper;
        this.wordRepository = wordRepository;
        this.speechGenerationService = speechGenerationService;
    }

    public ResVocabularyAiEnrichResultDTO enrichWords(List<VocabularyWord> words) throws IdInvalidException {
        ResVocabularyAiEnrichResultDTO result = new ResVocabularyAiEnrichResultDTO();
        if (words == null || words.isEmpty()) {
            result.setMessage("Không có từ nào trong bộ");
            return result;
        }

        List<VocabularyWord> needPhonetic = words.stream()
                .filter(w -> isBlank(w.getPhonetic()))
                .toList();
        List<VocabularyWord> needAudio = words.stream()
                .filter(w -> isBlank(w.getAudioUkUrl()) && isBlank(w.getAudioUsUrl()))
                .toList();

        result.setPhoneticSkipped(words.size() - needPhonetic.size());
        result.setAudioSkipped(words.size() - needAudio.size());

        log.info(
                "[VocabAiEnrich] start words={} needPhonetic={} needAudio={} speechEnabled={} aiEnabled={}",
                words.size(),
                needPhonetic.size(),
                needAudio.size(),
                speechGenerationService.isEnabled(),
                aiEnabled);

        if (!needPhonetic.isEmpty()) {
            int filled = fillMissingPhonetics(needPhonetic);
            result.setPhoneticFilled(filled);
        }

        if (!needAudio.isEmpty()) {
            if (!speechGenerationService.isAvailable()) {
                log.warn(
                        "[VocabAiEnrich] Speech platform unavailable — skip TTS for {} words. "
                                + "Check SPEECH_PLATFORM_ENABLED and reading_text on :8100",
                        needAudio.size());
                result.setAudioFailed(needAudio.size());
            } else {
                int filled = 0;
                int failed = 0;
                for (VocabularyWord word : needAudio) {
                    if (synthesizeAndSaveAudio(word)) {
                        filled++;
                    } else {
                        failed++;
                    }
                }
                result.setAudioFilled(filled);
                result.setAudioFailed(failed);
            }
        }

        result.setMessage(buildMessage(result));
        log.info(
                "[VocabAiEnrich] done phoneticFilled={} audioFilled={} audioFailed={} message={}",
                result.getPhoneticFilled(),
                result.getAudioFilled(),
                result.getAudioFailed(),
                result.getMessage());
        return result;
    }

    private int fillMissingPhonetics(List<VocabularyWord> words) throws IdInvalidException {
        if (!aiEnabled) {
            throw new IdInvalidException("AI đang tắt — không thể sinh IPA");
        }

        List<String> wordEns = words.stream().map(VocabularyWord::getWordEn).toList();
        log.info("[VocabAiEnrich] AI IPA request model={} count={}", enrichModel, wordEns.size());

        String userPrompt =
                "Generate IPA for these English words/phrases. Return JSON only.\n"
                        + "words:\n"
                        + objectMapper.valueToTree(wordEns);

        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", IPA_SYSTEM_PROMPT),
                Map.of("role", "user", "content", userPrompt));

        OpenRouterClient.ChatResult chat =
                openRouterClient.chatJson(enrichModel, messages, enrichTimeoutSec);
        Map<String, String> phoneticByKey = parsePhoneticMap(chat.getContent());

        int filled = 0;
        for (VocabularyWord word : words) {
            if (!isBlank(word.getPhonetic())) {
                continue;
            }
            String key = word.getWordEn().trim().toLowerCase(Locale.ROOT);
            String phonetic = phoneticByKey.get(key);
            if (isBlank(phonetic)) {
                log.warn("[VocabAiEnrich] AI missing IPA for word='{}'", word.getWordEn());
                continue;
            }
            word.setPhonetic(normalizePhonetic(phonetic));
            if (isBlank(word.getEnrichSource())) {
                word.setEnrichSource("ai");
            }
            wordRepository.save(word);
            filled++;
            log.info("[VocabAiEnrich] IPA filled word='{}' phonetic={}", word.getWordEn(), word.getPhonetic());
        }
        return filled;
    }

    private boolean synthesizeAndSaveAudio(VocabularyWord word) {
        String text = word.getWordEn() == null ? "" : word.getWordEn().trim();
        if (text.isEmpty()) {
            return false;
        }
        long started = System.currentTimeMillis();
        try {
            log.info("[VocabAiEnrich] TTS start word='{}' id={}", text, word.getId());
            SpeechResult speech = speechGenerationService.generate(
                    SpeechGenerationRequest.builder()
                            .text(text)
                            .ttsProvider("edge")
                            .alignmentProvider("none")
                            .format("mp3")
                            .build());

            String audioUrl = speech.getAudioUrl();
            if (isBlank(audioUrl)) {
                log.error("[VocabAiEnrich] TTS empty audioUrl word='{}'", text);
                return false;
            }

            // Edge default voice is US — fill US; also set UK if empty so compact preview shows a speaker.
            if (isBlank(word.getAudioUsUrl())) {
                word.setAudioUsUrl(audioUrl.trim());
            }
            if (isBlank(word.getAudioUkUrl())) {
                word.setAudioUkUrl(audioUrl.trim());
            }
            if (isBlank(word.getEnrichSource()) || "ai".equals(word.getEnrichSource())) {
                word.setEnrichSource("ai+edge-tts");
            } else if (!word.getEnrichSource().contains("edge-tts")) {
                word.setEnrichSource(word.getEnrichSource() + "+edge-tts");
            }
            wordRepository.save(word);
            log.info(
                    "[VocabAiEnrich] TTS ok word='{}' audioUrl={} provider={} voice={} elapsedMs={}",
                    text,
                    audioUrl,
                    speech.getProvider(),
                    speech.getVoice(),
                    System.currentTimeMillis() - started);
            return true;
        } catch (Exception ex) {
            log.error(
                    "[VocabAiEnrich] TTS failed word='{}' elapsedMs={} reason={}",
                    text,
                    System.currentTimeMillis() - started,
                    ex.getMessage(),
                    ex);
            return false;
        }
    }

    private Map<String, String> parsePhoneticMap(String json) throws IdInvalidException {
        if (json == null || json.isBlank()) {
            throw new IdInvalidException("AI không trả IPA");
        }
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode items = root.get("items");
            if (items == null || !items.isArray()) {
                throw new IdInvalidException("AI trả JSON IPA không hợp lệ (thiếu items)");
            }
            Map<String, String> map = new HashMap<>();
            for (JsonNode item : items) {
                String wordEn = textOrNull(item, "wordEn");
                String phonetic = textOrNull(item, "phonetic");
                if (isBlank(wordEn) || isBlank(phonetic)) {
                    continue;
                }
                map.put(wordEn.trim().toLowerCase(Locale.ROOT), phonetic.trim());
            }
            return map;
        } catch (IdInvalidException e) {
            throw e;
        } catch (Exception e) {
            throw new IdInvalidException("AI trả JSON IPA không hợp lệ");
        }
    }

    private static String normalizePhonetic(String raw) {
        String value = raw.trim();
        if (value.startsWith("/") && value.endsWith("/") && value.length() >= 2) {
            return value.length() > 128 ? value.substring(0, 128) : value;
        }
        String wrapped = "/" + value.replaceAll("^/+|/+$", "") + "/";
        return wrapped.length() > 128 ? wrapped.substring(0, 128) : wrapped;
    }

    private static String textOrNull(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        return node.get(field).asText("").trim();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String buildMessage(ResVocabularyAiEnrichResultDTO result) {
        List<String> parts = new ArrayList<>();
        parts.add("IPA +" + result.getPhoneticFilled() + " (bỏ qua " + result.getPhoneticSkipped() + ")");
        parts.add("Audio +" + result.getAudioFilled() + " (bỏ qua " + result.getAudioSkipped() + ")");
        if (result.getAudioFailed() > 0) {
            parts.add("TTS lỗi " + result.getAudioFailed());
        }
        return String.join(" · ", parts);
    }
}
