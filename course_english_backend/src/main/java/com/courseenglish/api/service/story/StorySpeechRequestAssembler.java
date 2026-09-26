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

/**
 * Story TTS is Edge-only (no ElevenLabs).
 */
@Component
public class StorySpeechRequestAssembler {

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

    /** Edge TTS only. */
    public SpeechGenerationRequest assemble(Story story, StoryTokensPayloadDTO tokensPayload) {
        return assembleEdge(story, tokensPayload);
    }

    public SpeechGenerationRequest assembleEdge(Story story, StoryTokensPayloadDTO tokensPayload) {
        VoiceSelection voice = resolveEdgeVoice(story);
        return buildRequest(story, tokensPayload, voice);
    }

    /** @deprecated Use {@link #assembleEdge}. */
    public SpeechGenerationRequest assembleEdgeFallback(Story story, StoryTokensPayloadDTO tokensPayload) {
        return assembleEdge(story, tokensPayload);
    }

    public String contentHash(Story story) {
        VoiceSelection primary = resolveEdgeVoice(story);
        String payload = String.join("|",
                nullToEmpty(story.getContent()),
                primary.voiceId(),
                PROVIDER_EDGE,
                speechProperties.getDefaultAlignmentProvider(),
                speechProperties.getDefaultFormat(),
                "edge-only");
        return sha256Hex(payload);
    }

    private SpeechGenerationRequest buildRequest(
            Story story, StoryTokensPayloadDTO tokensPayload, VoiceSelection voice) {
        return SpeechGenerationRequest.builder()
                .text(story.getContent())
                .tokens(extractWordTokens(tokensPayload))
                .sentences(mapSentenceRefs(tokensPayload))
                .ttsProvider(PROVIDER_EDGE)
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

    /** Always resolve an Edge voice; map profile keys away from ElevenLabs if present in JSON. */
    private VoiceSelection resolveEdgeVoice(Story story) {
        Optional<String> profileKey = resolveProfileKey(story);
        if (profileKey.isPresent()) {
            Optional<TtsVoiceCatalog> mapped = ttsVoiceCatalogRepository
                    .findFirstByProfileKeyAndProviderAndVoidedFalseAndActiveTrueOrderByPriorityAsc(
                            profileKey.get(), PROVIDER_EDGE);
            if (mapped.isPresent()) {
                TtsVoiceCatalog voice = mapped.get();
                return new VoiceSelection(PROVIDER_EDGE, voice.getVoiceId());
            }
        }

        Optional<String> preferredVoiceId = resolvePreferredEdgeVoiceId(story);
        if (preferredVoiceId.isPresent()) {
            Optional<TtsVoiceCatalog> exact = ttsVoiceCatalogRepository
                    .findFirstByProviderAndVoiceIdAndVoidedFalseAndActiveTrue(
                            PROVIDER_EDGE, preferredVoiceId.get());
            if (exact.isPresent()) {
                return new VoiceSelection(PROVIDER_EDGE, exact.get().getVoiceId());
            }
        }

        Optional<TtsVoiceCatalog> narrator = ttsVoiceCatalogRepository
                .findFirstByProfileKeyAndProviderAndVoidedFalseAndActiveTrueOrderByPriorityAsc(
                        "NARRATOR", PROVIDER_EDGE);
        if (narrator.isPresent()) {
            return new VoiceSelection(PROVIDER_EDGE, narrator.get().getVoiceId());
        }
        String fallback = speechProperties.getDefaultVoice();
        if (fallback == null || fallback.isBlank()) {
            fallback = "en-US-AriaNeural";
        }
        return new VoiceSelection(PROVIDER_EDGE, fallback);
    }

    private Optional<String> resolveProfileKey(Story story) {
        if (story == null || story.getVoiceProfileJson() == null || story.getVoiceProfileJson().isBlank()) {
            return Optional.empty();
        }
        try {
            JsonNode root = objectMapper.readTree(story.getVoiceProfileJson());
            for (String key : PROFILE_PRIORITY) {
                JsonNode node = root.get(key);
                if (node != null && !node.isNull()) {
                    return Optional.of(key);
                }
            }
        } catch (Exception ignored) {
            // fallback below
        }
        return Optional.empty();
    }

    private Optional<String> resolvePreferredEdgeVoiceId(Story story) {
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
                if (node.isTextual()) {
                    String id = node.asText("").trim();
                    if (!id.isBlank() && looksLikeEdgeVoiceId(id)) {
                        return Optional.of(id);
                    }
                    continue;
                }
                if (!node.isObject()) {
                    continue;
                }
                String provider = textNode(node.get("provider")).toLowerCase(Locale.ROOT);
                String voiceId = textNode(node.get("voiceId"));
                if (voiceId.isBlank()) {
                    continue;
                }
                if (provider.isBlank() || PROVIDER_EDGE.equals(provider)) {
                    if (provider.isBlank() && !looksLikeEdgeVoiceId(voiceId)) {
                        continue;
                    }
                    return Optional.of(voiceId);
                }
            }
        } catch (Exception ignored) {
            // fallback below
        }
        return Optional.empty();
    }

    private static boolean looksLikeEdgeVoiceId(String voiceId) {
        return voiceId.contains("-") && voiceId.toLowerCase(Locale.ROOT).contains("neural");
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
}
