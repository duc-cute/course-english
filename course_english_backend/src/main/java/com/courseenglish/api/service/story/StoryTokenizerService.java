package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.VocabularyWord;
import com.courseenglish.api.domain.dto.story.StorySentenceDTO;
import com.courseenglish.api.domain.dto.story.StoryTokenDTO;
import com.courseenglish.api.domain.dto.story.StoryTokensPayloadDTO;
import com.courseenglish.api.repository.VocabularySetMemberRepository;
import com.courseenglish.api.repository.VocabularyWordRepository;
import com.courseenglish.api.util.StoryWordKeyUtil;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class StoryTokenizerService {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("([a-zA-Z0-9']+|[^a-zA-Z0-9']+)");

    private final VocabularySetMemberRepository vocabularySetMemberRepository;
    private final VocabularyWordRepository vocabularyWordRepository;

    public StoryTokenizerService(
            VocabularySetMemberRepository vocabularySetMemberRepository,
            VocabularyWordRepository vocabularyWordRepository) {
        this.vocabularySetMemberRepository = vocabularySetMemberRepository;
        this.vocabularyWordRepository = vocabularyWordRepository;
    }

    public StoryTokensPayloadDTO tokenize(String content, UUID vocabularySetId) {
        if (content == null || content.isEmpty()) {
            return new StoryTokensPayloadDTO();
        }
        return tokenizeWith(content, buildVocabularyLookup(content, vocabularySetId));
    }

    /** Tách câu giống reader nhưng không tra vocab DB (dùng cho thống kê / log). */
    public List<StorySentenceDTO> splitSentences(String content) {
        if (content == null || content.isEmpty()) {
            return List.of();
        }
        return tokenizeWith(content, Map.of()).getSentences();
    }

    private StoryTokensPayloadDTO tokenizeWith(String content, Map<String, UUID> vocabLookup) {
        StoryTokensPayloadDTO payload = new StoryTokensPayloadDTO();
        List<StoryTokenDTO> tokens = new ArrayList<>();
        List<StorySentenceDTO> sentences = new ArrayList<>();

        Matcher matcher = TOKEN_PATTERN.matcher(content);
        int wordIndex = 0;
        int sentenceIndex = 0;
        int sentenceStartWordIndex = 0;
        StringBuilder sentenceText = new StringBuilder();

        while (matcher.find()) {
            String piece = matcher.group(1);
            if (piece == null || piece.isEmpty()) {
                continue;
            }

            sentenceText.append(piece);

            if (isWordPiece(piece)) {
                String wordKey = StoryWordKeyUtil.toWordKey(piece);
                StoryTokenDTO wordToken = new StoryTokenDTO();
                wordToken.setType("word");
                wordToken.setText(piece);
                wordToken.setWordIndex(wordIndex);

                UUID vocabularyId = vocabLookup.get(wordKey);
                if (vocabularyId != null) {
                    wordToken.setVocabularyId(vocabularyId);
                    wordToken.setIsVocab(true);
                } else {
                    wordToken.setIsVocab(false);
                }

                tokens.add(wordToken);
                wordIndex++;
            } else {
                StoryTokenDTO textToken = new StoryTokenDTO();
                textToken.setType("text");
                textToken.setValue(piece);
                tokens.add(textToken);

                if (endsSentence(piece)) {
                    String rawSentence = sentenceText.toString();
                    String text = finalizeSentenceText(rawSentence);
                    String carry = extractCarryOver(rawSentence, text);

                    StorySentenceDTO sentence = new StorySentenceDTO();
                    sentence.setSentenceIndex(sentenceIndex);
                    sentence.setStartWordIndex(sentenceStartWordIndex);
                    sentence.setEndWordIndex(Math.max(sentenceStartWordIndex, wordIndex - 1));
                    sentence.setText(text);
                    sentences.add(sentence);

                    sentenceIndex++;
                    sentenceStartWordIndex = wordIndex;
                    sentenceText = new StringBuilder(carry);
                }
            }
        }

        if (!sentenceText.isEmpty() && wordIndex > sentenceStartWordIndex) {
            StorySentenceDTO sentence = new StorySentenceDTO();
            sentence.setSentenceIndex(sentenceIndex);
            sentence.setStartWordIndex(sentenceStartWordIndex);
            sentence.setEndWordIndex(wordIndex - 1);
            sentence.setText(finalizeSentenceText(sentenceText.toString()));
            sentences.add(sentence);
        } else if (!sentenceText.isEmpty() && sentences.isEmpty() && wordIndex == 0) {
            StorySentenceDTO sentence = new StorySentenceDTO();
            sentence.setSentenceIndex(0);
            sentence.setStartWordIndex(0);
            sentence.setEndWordIndex(-1);
            sentence.setText(finalizeSentenceText(sentenceText.toString()));
            sentences.add(sentence);
        }

        payload.setTokens(tokens);
        payload.setSentences(sentences);
        return payload;
    }

    private Map<String, UUID> buildVocabularyLookup(String content, UUID vocabularySetId) {
        Set<String> storyWordKeys = collectStoryWordKeys(content);
        if (storyWordKeys.isEmpty()) {
            return Map.of();
        }

        Map<String, UUID> lookup = new HashMap<>();

        if (vocabularySetId != null) {
            vocabularySetMemberRepository.findResolvedBySetId(vocabularySetId).forEach(member -> {
                VocabularyWord word = member.getVocabularyWord();
                if (word != null && !word.isVoided()) {
                    lookup.put(word.getWordKey(), word.getId());
                }
            });
            lookup.keySet().retainAll(storyWordKeys);
            return lookup;
        }

        for (VocabularyWord word : vocabularyWordRepository.findByWordKeyInAndVoidedFalse(storyWordKeys)) {
            lookup.put(word.getWordKey(), word.getId());
        }
        return lookup;
    }

    private static Set<String> collectStoryWordKeys(String content) {
        Set<String> keys = new HashSet<>();
        Matcher matcher = TOKEN_PATTERN.matcher(content);
        while (matcher.find()) {
            String piece = matcher.group(1);
            if (isWordPiece(piece)) {
                String key = StoryWordKeyUtil.toWordKey(piece);
                if (!key.isBlank()) {
                    keys.add(key);
                }
            }
        }
        return keys;
    }

    private static boolean isWordPiece(String piece) {
        return piece != null && piece.chars().anyMatch(Character::isLetterOrDigit);
    }

    private static boolean endsSentence(String piece) {
        if (piece == null) {
            return false;
        }
        String trimmed = piece.trim();
        if (trimmed.isEmpty()) {
            return false;
        }
        // Dialogue often ends with !" ?" ." — treat as sentence end (same as AI split rules).
        while (trimmed.length() > 0) {
            char last = trimmed.charAt(trimmed.length() - 1);
            if (last == '"' || last == '\'' || Character.isWhitespace(last)) {
                trimmed = trimmed.substring(0, trimmed.length() - 1).trim();
                continue;
            }
            break;
        }
        if (trimmed.isEmpty()) {
            return false;
        }
        char last = trimmed.charAt(trimmed.length() - 1);
        return last == '.' || last == '!' || last == '?';
    }

    /** Trim sentence text to the last . ! ? (include a closing quote immediately after). */
    static String finalizeSentenceText(String raw) {
        String t = raw == null ? "" : raw.trim();
        if (t.isEmpty()) {
            return "";
        }
        int lastEnd = -1;
        for (int i = 0; i < t.length(); i++) {
            char c = t.charAt(i);
            if (c == '.' || c == '!' || c == '?') {
                lastEnd = i;
                if (i + 1 < t.length()) {
                    char next = t.charAt(i + 1);
                    if (next == '"' || next == '\'') {
                        lastEnd = i + 1;
                    }
                }
            }
        }
        if (lastEnd >= 0) {
            return t.substring(0, lastEnd + 1).trim();
        }
        return t;
    }

    /** Leading quote/space after a split delimiter belongs to the next sentence. */
    static String extractCarryOver(String raw, String finalized) {
        if (raw == null || finalized == null) {
            return "";
        }
        if (raw.length() <= finalized.length()) {
            return "";
        }
        return raw.substring(finalized.length()).trim();
    }
}
