package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.Story;
import com.courseenglish.api.domain.TtsVoiceCatalog;
import com.courseenglish.api.domain.dto.story.StorySentenceDTO;
import com.courseenglish.api.domain.dto.story.StoryTokenDTO;
import com.courseenglish.api.domain.dto.story.StoryTokensPayloadDTO;
import com.courseenglish.api.integration.speech.model.SpeechGenerationRequest;
import com.courseenglish.api.integration.speech.model.SpeechSentenceRef;
import com.courseenglish.api.integration.speech.platform.SpeechPlatformProperties;
import com.courseenglish.api.repository.TtsVoiceCatalogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class StorySpeechRequestAssembler {

    private static final String PROVIDER_ELEVENLABS = "elevenlabs";
    private static final String PROVIDER_EDGE = "edge";

    private static final List<String> PROFILE_PRIORITY = List.of(
            "NARRATOR",
            "MALE_ADULT",
            "FEMALE_ADULT",
            "BOY_CHILD",
            "GIRL_CHILD");

    private final SpeechPlatformProperties speechProperties;
    private final TtsVoiceCatalogRepository ttsVoiceCatalogRepository;
    private final ObjectMapper objectMapper;

    public StorySpeechRequestAssembler(
            SpeechPlatformProperties speechProperties,
            TtsVoiceCatalogRepository ttsVoiceCatalogRepository,
            ObjectMapper objectMapper) {
        this.speechProperties = speechProperties;
        this.ttsVoiceCatalogRepository = ttsVoiceCatalogRepository;
        this.objectMapper = objectMapper;
    }

    /** Primary path: ElevenLabs first. */
    public SpeechGenerationRequest assemble(Story story, StoryTokensPayloadDTO tokensPayload) {
        return assembleElevenLabs(story, tokensPayload);
    }

    public SpeechGenerationRequest assembleElevenLabs(Story story, StoryTokensPayloadDTO tokensPayload) {
        VoiceSelection voice = resolveVoiceForProvider(story, PROVIDER_ELEVENLABS);
        return buildRequest(story, tokensPayload, voice);
    }

    public SpeechGenerationRequest assembleEdgeFallback(Story story, StoryTokensPayloadDTO tokensPayload) {
        VoiceSelection voice = resolveVoiceForProvider(story, PROVIDER_EDGE);
        return buildRequest(story, tokensPayload, voice);
    }

    public String contentHash(Story story) {
        VoiceSelection primary = resolveVoiceForProvider(story, PROVIDER_ELEVENLABS);
        String payload = String.join("|",
                nullToEmpty(story.getContent()),
                primary.voiceId(),
                primary.provider(),
                speechProperties.getDefaultAlignmentProvider(),
                speechProperties.getDefaultFormat(),
                "elevenlabs-first");
        return sha256Hex(payload);
    }

    private SpeechGenerationRequest buildRequest(
            Story story, StoryTokensPayloadDTO tokensPayload, VoiceSelection voice) {
        return SpeechGenerationRequest.builder()
                .text(story.getContent())
                .tokens(extractWordTokens(tokensPayload))
                .sentences(mapSentenceRefs(tokensPayload))
                .ttsProvider(voice.provider())
                .alignmentProvider(speechProperties.getDefaultAlignmentProvider())
                .voice(voice.voiceId())
                .speed(speechProperties.getDefaultSpeed())
                .format(speechProperties.getDefaultFormat())
                .build();
    }

    private List<String> extractWordTokens(StoryTokensPayloadDTO payload) {
        if (payload == null || payload.getTokens() == null) {
            return List.of();
        }
        return payload.getTokens().stream()
                .filter(token -> "word".equalsIgnoreCase(token.getType()))
                .map(StoryTokenDTO::getText)
                .filter(text -> text != null && !text.isBlank())
                .collect(Collectors.toList());
    }

    private List<SpeechSentenceRef> mapSentenceRefs(StoryTokensPayloadDTO payload) {
        if (payload == null || payload.getSentences() == null) {
            return List.of();
        }
        List<SpeechSentenceRef> refs = new ArrayList<>();
        for (StorySentenceDTO sentence : payload.getSentences()) {
            refs.add(SpeechSentenceRef.builder()
                    .sentenceIndex(sentence.getSentenceIndex())
                    .startWordIndex(sentence.getStartWordIndex())
                    .endWordIndex(sentence.getEndWordIndex())
                    .build());
        }
        return refs;
    }

    private VoiceSelection resolveVoiceForProvider(Story story, String targetProvider) {
        String normalizedProvider = targetProvider.toLowerCase(Locale.ROOT);
        Optional<ProfileSelection> profileSelection = resolveProfileSelection(story);

        if (profileSelection.isPresent()) {
            ProfileSelection selection = profileSelection.get();
            if (normalizedProvider.equals(selection.voice().provider())) {
                return selection.voice();
            }
            Optional<TtsVoiceCatalog> mapped = ttsVoiceCatalogRepository
                    .findFirstByProfileKeyAndProviderAndVoidedFalseAndActiveTrueOrderByPriorityAsc(
                            selection.profileKey(), normalizedProvider);
            if (mapped.isPresent()) {
                TtsVoiceCatalog voice = mapped.get();
                return new VoiceSelection(voice.getProvider(), voice.getVoiceId());
            }
        }

        if (PROVIDER_ELEVENLABS.equals(normalizedProvider)) {
            Optional<TtsVoiceCatalog> narrator = ttsVoiceCatalogRepository
                    .findFirstByProfileKeyAndProviderAndVoidedFalseAndActiveTrueOrderByPriorityAsc(
                            "NARRATOR", PROVIDER_ELEVENLABS);
            if (narrator.isPresent()) {
                TtsVoiceCatalog voice = narrator.get();
                return new VoiceSelection(voice.getProvider(), voice.getVoiceId());
            }
        }

        if (PROVIDER_EDGE.equals(normalizedProvider)) {
            Optional<TtsVoiceCatalog> narrator = ttsVoiceCatalogRepository
                    .findFirstByProfileKeyAndProviderAndVoidedFalseAndActiveTrueOrderByPriorityAsc(
                            "NARRATOR", PROVIDER_EDGE);
            if (narrator.isPresent()) {
                TtsVoiceCatalog voice = narrator.get();
                return new VoiceSelection(voice.getProvider(), voice.getVoiceId());
            }
            return new VoiceSelection(PROVIDER_EDGE, speechProperties.getDefaultVoice());
        }

        return new VoiceSelection(
                speechProperties.getDefaultTtsProvider(),
                speechProperties.getDefaultVoice());
    }

    private Optional<ProfileSelection> resolveProfileSelection(Story story) {
        if (story == null || story.getVoiceProfileJson() == null || story.getVoiceProfileJson().isBlank()) {
            return Optional.empty();
        }
        try {
            JsonNode root = objectMapper.readTree(story.getVoiceProfileJson());
            for (String profileKey : PROFILE_PRIORITY) {
                JsonNode node = root.get(profileKey);
                if (node == null || node.isNull()) {
                    continue;
                }
                Optional<VoiceSelection> picked = parseVoiceSelectionNode(node);
                if (picked.isPresent()) {
                    return Optional.of(new ProfileSelection(profileKey, picked.get()));
                }
            }
        } catch (Exception ignored) {
            // fallback below
        }
        return Optional.empty();
    }

    private Optional<VoiceSelection> parseVoiceSelectionNode(JsonNode node) {
        if (node.isTextual()) {
            return resolveFromVoiceIdOnly(node.asText(""));
        }
        if (!node.isObject()) {
            return Optional.empty();
        }

        String provider = textNode(node.get("provider"));
        String voiceId = textNode(node.get("voiceId"));
        if (voiceId.isBlank()) {
            return Optional.empty();
        }
        if (!provider.isBlank()) {
            Optional<TtsVoiceCatalog> exact = ttsVoiceCatalogRepository
                    .findFirstByProviderAndVoiceIdAndVoidedFalseAndActiveTrue(
                            provider.trim().toLowerCase(Locale.ROOT), voiceId.trim());
            if (exact.isPresent()) {
                TtsVoiceCatalog voice = exact.get();
                return Optional.of(new VoiceSelection(voice.getProvider(), voice.getVoiceId()));
            }
            return Optional.of(new VoiceSelection(provider.trim().toLowerCase(Locale.ROOT), voiceId.trim()));
        }
        return resolveFromVoiceIdOnly(voiceId.trim());
    }

    private Optional<VoiceSelection> resolveFromVoiceIdOnly(String voiceId) {
        if (voiceId == null || voiceId.isBlank()) {
            return Optional.empty();
        }
        List<TtsVoiceCatalog> candidates = ttsVoiceCatalogRepository
                .findByVoiceIdAndVoidedFalseAndActiveTrueOrderByPriorityAsc(voiceId.trim());
        if (!candidates.isEmpty()) {
            TtsVoiceCatalog first = candidates.get(0);
            return Optional.of(new VoiceSelection(first.getProvider(), first.getVoiceId()));
        }
        return Optional.of(new VoiceSelection(speechProperties.getDefaultTtsProvider(), voiceId.trim()));
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static String textNode(JsonNode node) {
        if (node == null || node.isNull()) {
            return "";
        }
        return node.asText("").trim();
    }

    private record VoiceSelection(String provider, String voiceId) {
    }

    private record ProfileSelection(String profileKey, VoiceSelection voice) {
    }
}
