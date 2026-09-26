package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.Story;
import com.courseenglish.api.domain.WordPronunciationCache;
import com.courseenglish.api.domain.dto.story.StoryGlossaryEntryDTO;
import com.courseenglish.api.domain.dto.story.StoryTranslationsPayloadDTO;
import com.courseenglish.api.integration.dictionary.model.VocabularyEnrichmentData;
import com.courseenglish.api.integration.dictionary.service.DictionaryLookupService;
import com.courseenglish.api.integration.speech.model.SpeechGenerationRequest;
import com.courseenglish.api.integration.speech.model.SpeechResult;
import com.courseenglish.api.integration.speech.service.SpeechGenerationService;
import com.courseenglish.api.repository.StoryRepository;
import com.courseenglish.api.repository.WordPronunciationCacheRepository;
import com.courseenglish.api.util.StoryWordKeyUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Bổ sung IPA + audio cho glossary của story — chạy NỀN sau khi Lưu (không chặn request).
 *
 * Thứ tự ưu tiên mỗi từ: cache dùng chung → IPA do AI trả (đã có sẵn trong glossary)
 * → Free Dictionary (fallback IPA) → Edge TTS qua reading_text (audio, không alignment).
 */
@Service
public class StoryGlossaryEnrichService {

    private static final Logger log = LoggerFactory.getLogger(StoryGlossaryEnrichService.class);
    /** Bỏ alignment (faster-whisper) — Python hiểu "none". */
    private static final String NO_ALIGNMENT = "none";

    private final StoryRepository storyRepository;
    private final WordPronunciationCacheRepository cacheRepository;
    private final DictionaryLookupService dictionaryLookupService;
    private final SpeechGenerationService speechGenerationService;
    private final ObjectMapper objectMapper;

    public StoryGlossaryEnrichService(
            StoryRepository storyRepository,
            WordPronunciationCacheRepository cacheRepository,
            DictionaryLookupService dictionaryLookupService,
            SpeechGenerationService speechGenerationService,
            ObjectMapper objectMapper) {
        this.storyRepository = storyRepository;
        this.cacheRepository = cacheRepository;
        this.dictionaryLookupService = dictionaryLookupService;
        this.speechGenerationService = speechGenerationService;
        this.objectMapper = objectMapper;
    }

    /** Không @Transactional: tránh giữ connection DB trong lúc gọi HTTP (từ điển / TTS). */
    public void enrichStory(UUID storyId) {
        Story story = storyRepository.findByIdAndVoidedFalse(storyId).orElse(null);
        if (story == null || story.getTranslationsJson() == null || story.getTranslationsJson().isBlank()) {
            return;
        }
        StoryTranslationsPayloadDTO translations;
        try {
            translations = objectMapper.readValue(story.getTranslationsJson(), StoryTranslationsPayloadDTO.class);
        } catch (JsonProcessingException e) {
            log.warn("[StoryGlossary] translations_json không đọc được storyId={}", storyId);
            return;
        }
        List<StoryGlossaryEntryDTO> glossary = translations.getGlossary();
        if (glossary == null || glossary.isEmpty()) {
            return;
        }

        long started = System.currentTimeMillis();
        int cacheHits = 0;
        int dictCalls = 0;
        int ttsCalls = 0;
        int failed = 0;
        boolean changed = false;

        Map<String, WordPronunciationCache> cached = new HashMap<>();
        cacheRepository
                .findByWordKeyInAndVoidedFalse(glossary.stream().map(StoryGlossaryEntryDTO::getWordKey).toList())
                .forEach(c -> cached.put(c.getWordKey(), c));

        for (StoryGlossaryEntryDTO entry : glossary) {
            if (entry.getWordKey() == null || entry.getWordKey().isBlank()) {
                continue;
            }
            boolean needsPhonetic = isBlank(entry.getPhonetic());
            boolean needsAudio = isBlank(entry.getAudioUsUrl()) && isBlank(entry.getAudioUkUrl());
            if (!needsPhonetic && !needsAudio) {
                continue;
            }

            WordPronunciationCache cache = cached.get(entry.getWordKey());
            if (cache != null && (!needsPhonetic || !isBlank(cache.getPhonetic()))
                    && (!needsAudio || !isBlank(cache.getAudioUrl()) || !isBlank(cache.getAudioUkUrl()))) {
                applyCache(entry, cache);
                cacheHits++;
                changed = true;
                continue;
            }

            try {
                if (cache == null) {
                    cache = new WordPronunciationCache();
                    cache.setWordKey(entry.getWordKey());
                    cache.setWordEn(entry.getWordEn() != null ? entry.getWordEn() : entry.getWordKey());
                }
                // IPA do AI trả → ghi vào cache (nguồn "ai") nếu cache chưa có
                if (isBlank(cache.getPhonetic()) && !isBlank(entry.getPhonetic())) {
                    cache.setPhonetic(entry.getPhonetic());
                    cache.setPhoneticSource("ai");
                }
                if (isBlank(cache.getPartOfSpeech()) && !isBlank(entry.getPartOfSpeech())) {
                    cache.setPartOfSpeech(entry.getPartOfSpeech());
                }
                // Fallback IPA từ từ điển — chỉ khi AI không trả
                if (isBlank(cache.getPhonetic())) {
                    dictCalls++;
                    Optional<VocabularyEnrichmentData> dict = dictionaryLookupService.lookup(entry.getWordEn());
                    if (dict.isPresent()) {
                        VocabularyEnrichmentData d = dict.get();
                        cache.setPhonetic(StoryTranslationMergeService.normalizeIpa(d.getPhonetic()));
                        cache.setPhoneticSource(isBlank(cache.getPhonetic()) ? null : "dictionary");
                        if (isBlank(cache.getAudioUkUrl())) {
                            cache.setAudioUkUrl(d.getAudioUkUrl());
                        }
                        if (isBlank(cache.getAudioUrl())) {
                            cache.setAudioUrl(d.getAudioUsUrl());
                        }
                        if (isBlank(cache.getPartOfSpeech())) {
                            cache.setPartOfSpeech(d.getPartOfSpeech());
                        }
                    }
                }
                // Audio TTS — mỗi word_key một lần cho toàn hệ thống
                if (isBlank(cache.getAudioUrl()) && isBlank(cache.getAudioUkUrl())) {
                    if (speechGenerationService.isEnabled()) {
                        ttsCalls++;
                        SpeechResult tts = speechGenerationService.generate(SpeechGenerationRequest.builder()
                                .text(cache.getWordEn())
                                .alignmentProvider(NO_ALIGNMENT)
                                .build());
                        cache.setAudioUrl(tts.getAudioUrl());
                        cache.setTtsProvider(tts.getProvider());
                        cache.setTtsVoice(tts.getVoice());
                    }
                }
                cache = cacheRepository.save(cache);
                cached.put(cache.getWordKey(), cache);
                applyCache(entry, cache);
                changed = true;
            } catch (Exception ex) {
                failed++;
                log.warn("[StoryGlossary] enrich failed word='{}' reason={}", entry.getWordEn(), ex.getMessage());
            }
        }

        if (changed) {
            try {
                story.setTranslationsJson(objectMapper.writeValueAsString(translations));
                storyRepository.save(story);
            } catch (JsonProcessingException e) {
                log.warn("[StoryGlossary] không ghi được translations_json storyId={}", storyId);
            }
        }
        log.info(
                "[StoryGlossary] Done storyId={} glossary={} cacheHits={} dictCalls={} ttsCalls={} failed={} durationMs={}",
                storyId, glossary.size(), cacheHits, dictCalls, ttsCalls, failed,
                System.currentTimeMillis() - started);
    }

    /** Cho popup lookup-word (từ ngoài glossary): tra cache trước, không gọi TTS. */
    public Optional<WordPronunciationCache> findCached(String wordKey) {
        if (wordKey == null || wordKey.isBlank()) {
            return Optional.empty();
        }
        return cacheRepository.findByWordKeyAndVoidedFalse(StoryWordKeyUtil.toWordKey(wordKey));
    }

    private static void applyCache(StoryGlossaryEntryDTO entry, WordPronunciationCache cache) {
        if (isBlank(entry.getPhonetic())) {
            entry.setPhonetic(cache.getPhonetic());
        }
        if (isBlank(entry.getPartOfSpeech())) {
            entry.setPartOfSpeech(cache.getPartOfSpeech());
        }
        if (isBlank(entry.getAudioUsUrl())) {
            entry.setAudioUsUrl(cache.getAudioUrl());
        }
        if (isBlank(entry.getAudioUkUrl())) {
            entry.setAudioUkUrl(cache.getAudioUkUrl());
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
