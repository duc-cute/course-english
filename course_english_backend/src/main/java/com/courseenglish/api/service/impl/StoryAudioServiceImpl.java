package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Story;
import com.courseenglish.api.domain.StoryAudio;
import com.courseenglish.api.domain.dto.story.StorySentenceTimelineDTO;
import com.courseenglish.api.domain.dto.story.StoryTokensPayloadDTO;
import com.courseenglish.api.domain.dto.story.StoryWordTimelineDTO;
import com.courseenglish.api.domain.response.ResStoryAudioDTO;
import com.courseenglish.api.domain.response.ResStoryReaderPayloadDTO;
import com.courseenglish.api.integration.speech.SpeechNotAvailableException;
import com.courseenglish.api.integration.speech.model.SentenceTimelineData;
import com.courseenglish.api.integration.speech.model.SpeechGenerationRequest;
import com.courseenglish.api.integration.speech.model.SpeechResult;
import com.courseenglish.api.integration.speech.model.WordTimelineData;
import com.courseenglish.api.integration.speech.service.SpeechGenerationService;
import com.courseenglish.api.repository.StoryAudioRepository;
import com.courseenglish.api.repository.StoryRepository;
import com.courseenglish.api.service.story.StoryAudioService;
import com.courseenglish.api.service.story.StoryAudioWorker;
import com.courseenglish.api.service.story.StorySpeechRequestAssembler;
import com.courseenglish.api.service.story.StoryTokenizerService;
import com.courseenglish.api.util.constant.StoryProcessingStatusEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StoryAudioServiceImpl implements StoryAudioService {

    private static final Logger log = LoggerFactory.getLogger(StoryAudioServiceImpl.class);

    private final StoryRepository storyRepository;
    private final StoryAudioRepository storyAudioRepository;
    private final StoryTokenizerService storyTokenizerService;
    private final StorySpeechRequestAssembler speechRequestAssembler;
    private final SpeechGenerationService speechGenerationService;
    private final StoryAudioWorker storyAudioWorker;
    private final ObjectMapper objectMapper;

    public StoryAudioServiceImpl(
            StoryRepository storyRepository,
            StoryAudioRepository storyAudioRepository,
            StoryTokenizerService storyTokenizerService,
            StorySpeechRequestAssembler speechRequestAssembler,
            SpeechGenerationService speechGenerationService,
            @Lazy StoryAudioWorker storyAudioWorker,
            ObjectMapper objectMapper) {
        this.storyRepository = storyRepository;
        this.storyAudioRepository = storyAudioRepository;
        this.storyTokenizerService = storyTokenizerService;
        this.speechRequestAssembler = speechRequestAssembler;
        this.speechGenerationService = speechGenerationService;
        this.storyAudioWorker = storyAudioWorker;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public ResStoryAudioDTO queueGeneration(UUID storyId) throws IdInvalidException {
        Story story = requireStory(storyId);
        if (!speechGenerationService.isEnabled()) {
            throw new SpeechNotAvailableException(
                    "Speech platform chưa bật. Cấu hình integration.speech.platform.enabled=true");
        }

        ensureTokenized(story);
        String contentHash = speechRequestAssembler.contentHash(story);

        if (storyAudioRepository
                .findFirstByStoryIdAndContentHashAndVoidedFalseOrderByCreatedAtDesc(story.getId(), contentHash)
                .isPresent()) {
            story.setProcessingStatus(StoryProcessingStatusEnum.AUDIO_READY);
            storyRepository.save(story);
            return buildStatusDto(story, true, "Audio đã sẵn sàng (cache)");
        }

        storyAudioWorker.generateAsync(story.getId());
        ResStoryAudioDTO dto = buildStatusDto(story, false, "Đang sinh audio...");
        dto.setProcessingStatus(StoryProcessingStatusEnum.TOKENIZED.name());
        return dto;
    }

    @Override
    public ResStoryAudioDTO getAudioStatus(UUID storyId) throws IdInvalidException {
        Story story = requireStory(storyId);
        return buildStatusDto(story, story.getProcessingStatus() == StoryProcessingStatusEnum.AUDIO_READY, null);
    }

    @Override
    @Transactional
    public void generateAndPersist(UUID storyId) {
        Story story;
        try {
            story = requireStory(storyId);
        } catch (IdInvalidException ex) {
            log.warn("Story not found for audio generation — storyId={}", storyId);
            return;
        }
        if (!speechGenerationService.isEnabled()) {
            log.warn("Speech platform disabled — skip story audio {}", storyId);
            return;
        }

        try {
            StoryTokensPayloadDTO tokensPayload = loadTokensPayload(story);
            String contentHash = speechRequestAssembler.contentHash(story);

            var cached = storyAudioRepository
                    .findFirstByStoryIdAndContentHashAndVoidedFalseOrderByCreatedAtDesc(
                            story.getId(), contentHash);
            if (cached.isPresent()) {
                story.setProcessingStatus(StoryProcessingStatusEnum.AUDIO_READY);
                storyRepository.save(story);
                return;
            }

            SpeechGenerationRequest primaryRequest =
                    speechRequestAssembler.assembleElevenLabs(story, tokensPayload);
            log.info(
                    "[StoryAudio] Start generation storyId={} primaryProvider={} primaryVoice={} contentLength={}",
                    storyId,
                    primaryRequest.getTtsProvider(),
                    primaryRequest.getVoice(),
                    primaryRequest.getText() == null ? 0 : primaryRequest.getText().length());

            SpeechResult result = generateWithEdgeFallback(story, tokensPayload, primaryRequest);

            voidPreviousAudio(story.getId());

            StoryAudio entity = new StoryAudio();
            entity.setStoryId(story.getId());
            entity.setVoice(result.getVoice());
            entity.setTtsProvider(result.getProvider());
            entity.setAlignmentProvider(primaryRequest.getAlignmentProvider());
            entity.setAudioUrl(result.getAudioUrl());
            entity.setDuration(BigDecimal.valueOf(result.getDuration()));
            entity.setWordTimelineJson(writeJson(mapWordTimeline(result.getTimeline())));
            entity.setSentenceTimelineJson(writeJson(mapSentenceTimeline(result.getSentenceTimeline())));
            entity.setContentHash(contentHash);
            storyAudioRepository.save(entity);

            story.setProcessingStatus(StoryProcessingStatusEnum.AUDIO_READY);
            storyRepository.save(story);
            log.info(
                    "[StoryAudio] Ready storyId={} provider={} voice={} duration={} audioUrl={}",
                    storyId,
                    result.getProvider(),
                    result.getVoice(),
                    result.getDuration(),
                    result.getAudioUrl());
        } catch (Exception ex) {
            log.error("[StoryAudio] Generation failed storyId={} reason={}", storyId, ex.getMessage(), ex);
        }
    }

    @Override
    public void attachAudioToReaderPayload(ResStoryReaderPayloadDTO dto, UUID storyId) {
        StoryAudio audio = findLatestAudio(storyId);
        if (audio == null) {
            return;
        }
        dto.setAudioUrl(audio.getAudioUrl());
        dto.setVoice(audio.getVoice());
        dto.setDuration(audio.getDuration());
        try {
            dto.setWordTimeline(readWordTimeline(audio));
            dto.setSentenceTimeline(readSentenceTimeline(audio));
        } catch (JsonProcessingException ex) {
            log.warn("Cannot read story audio timeline — storyId={}", storyId, ex);
        }
    }

    @Override
    @Transactional
    public void invalidateAudio(UUID storyId) {
        voidPreviousAudio(storyId);
    }

    public StoryAudio findLatestAudio(UUID storyId) {
        return storyAudioRepository.findFirstByStoryIdAndVoidedFalseOrderByCreatedAtDesc(storyId)
                .orElse(null);
    }

    public List<StoryWordTimelineDTO> readWordTimeline(StoryAudio audio) throws JsonProcessingException {
        if (audio == null || audio.getWordTimelineJson() == null || audio.getWordTimelineJson().isBlank()) {
            return List.of();
        }
        return objectMapper.readValue(
                audio.getWordTimelineJson(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, StoryWordTimelineDTO.class));
    }

    public List<StorySentenceTimelineDTO> readSentenceTimeline(StoryAudio audio) throws JsonProcessingException {
        if (audio == null || audio.getSentenceTimelineJson() == null || audio.getSentenceTimelineJson().isBlank()) {
            return List.of();
        }
        return objectMapper.readValue(
                audio.getSentenceTimelineJson(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, StorySentenceTimelineDTO.class));
    }

    @Transactional
    public void invalidateAudioForStory(UUID storyId) {
        voidPreviousAudio(storyId);
    }

    private void voidPreviousAudio(UUID storyId) {
        storyAudioRepository.findByStoryIdAndVoidedFalse(storyId).forEach(audio -> {
            audio.setVoided(true);
            storyAudioRepository.save(audio);
        });
    }

    private void ensureTokenized(Story story) {
        if (story.getTokensJson() == null || story.getTokensJson().isBlank()) {
            StoryTokensPayloadDTO payload = storyTokenizerService.tokenize(
                    story.getContent(), story.getVocabularySetId());
            try {
                story.setTokensJson(objectMapper.writeValueAsString(payload));
                story.setProcessingStatus(StoryProcessingStatusEnum.TOKENIZED);
                storyRepository.save(story);
            } catch (JsonProcessingException ex) {
                throw new IllegalStateException("Không lưu được tokens story", ex);
            }
        }
    }

    private StoryTokensPayloadDTO loadTokensPayload(Story story) throws JsonProcessingException {
        ensureTokenized(story);
        return objectMapper.readValue(story.getTokensJson(), StoryTokensPayloadDTO.class);
    }

    private SpeechResult generateWithEdgeFallback(
            Story story,
            StoryTokensPayloadDTO tokensPayload,
            SpeechGenerationRequest primaryRequest) {
        UUID storyId = story.getId();
        try {
            SpeechResult result = speechGenerationService.generate(primaryRequest);
            log.info(
                    "[StoryAudio] Primary provider succeeded storyId={} provider={} voice={}",
                    storyId,
                    result.getProvider(),
                    result.getVoice());
            return result;
        } catch (Exception primaryEx) {
            log.warn(
                    "[StoryAudio] Primary provider failed storyId={} provider={} voice={} reason={} — fallback to edge",
                    storyId,
                    primaryRequest.getTtsProvider(),
                    primaryRequest.getVoice(),
                    primaryEx.getMessage());

            SpeechGenerationRequest fallbackRequest =
                    speechRequestAssembler.assembleEdgeFallback(story, tokensPayload);
            log.info(
                    "[StoryAudio] Fallback attempt storyId={} provider={} voice={}",
                    storyId,
                    fallbackRequest.getTtsProvider(),
                    fallbackRequest.getVoice());

            SpeechResult fallbackResult = speechGenerationService.generate(fallbackRequest);
            log.info(
                    "[StoryAudio] Fallback provider succeeded storyId={} provider={} voice={}",
                    storyId,
                    fallbackResult.getProvider(),
                    fallbackResult.getVoice());
            return fallbackResult;
        }
    }

    private Story requireStory(UUID storyId) throws IdInvalidException {
        return storyRepository.findByIdAndVoidedFalse(storyId)
                .orElseThrow(() -> new IdInvalidException("Story không tồn tại"));
    }

    private ResStoryAudioDTO buildStatusDto(Story story, boolean cached, String message) {
        ResStoryAudioDTO dto = new ResStoryAudioDTO();
        dto.setStoryId(story.getId());
        dto.setProcessingStatus(story.getProcessingStatus().name());
        dto.setCached(cached);
        dto.setMessage(message);

        storyAudioRepository.findFirstByStoryIdAndVoidedFalseOrderByCreatedAtDesc(story.getId())
                .ifPresent(audio -> {
                    dto.setVoice(audio.getVoice());
                    dto.setAudioUrl(audio.getAudioUrl());
                    dto.setDuration(audio.getDuration());
                });
        return dto;
    }

    private String writeJson(Object value) throws JsonProcessingException {
        return objectMapper.writeValueAsString(value);
    }

    private List<StoryWordTimelineDTO> mapWordTimeline(List<WordTimelineData> timeline) {
        return timeline.stream().map(item -> {
            StoryWordTimelineDTO dto = new StoryWordTimelineDTO();
            dto.setWordIndex(item.getWordIndex());
            dto.setWord(item.getWord());
            dto.setStart(item.getStart());
            dto.setEnd(item.getEnd());
            dto.setCharStart(item.getCharStart());
            dto.setCharEnd(item.getCharEnd());
            return dto;
        }).collect(Collectors.toList());
    }

    private List<StorySentenceTimelineDTO> mapSentenceTimeline(List<SentenceTimelineData> timeline) {
        return timeline.stream().map(item -> {
            StorySentenceTimelineDTO dto = new StorySentenceTimelineDTO();
            dto.setSentenceIndex(item.getSentenceIndex());
            dto.setStart(item.getStart());
            dto.setEnd(item.getEnd());
            return dto;
        }).collect(Collectors.toList());
    }
}
