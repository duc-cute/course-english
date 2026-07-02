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
        StoryTokensPayloadDTO payload = new StoryTokensPayloadDTO();
        if (content == null || content.isEmpty()) {
            return payload;
        }

        Map<String, UUID> vocabLookup = buildVocabularyLookup(content, vocabularySetId);
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
                    StorySentenceDTO sentence = new StorySentenceDTO();
                    sentence.setSentenceIndex(sentenceIndex);
                    sentence.setStartWordIndex(sentenceStartWordIndex);
                    sentence.setEndWordIndex(Math.max(sentenceStartWordIndex, wordIndex - 1));
                    sentence.setText(sentenceText.toString().trim());
                    sentences.add(sentence);

                    sentenceIndex++;
                    sentenceStartWordIndex = wordIndex;
                    sentenceText = new StringBuilder();
                }
            }
        }

        if (!sentenceText.isEmpty() && wordIndex > sentenceStartWordIndex) {
            StorySentenceDTO sentence = new StorySentenceDTO();
            sentence.setSentenceIndex(sentenceIndex);
            sentence.setStartWordIndex(sentenceStartWordIndex);
            sentence.setEndWordIndex(wordIndex - 1);
            sentence.setText(sentenceText.toString().trim());
            sentences.add(sentence);
        } else if (!sentenceText.isEmpty() && sentences.isEmpty() && wordIndex == 0) {
            StorySentenceDTO sentence = new StorySentenceDTO();
            sentence.setSentenceIndex(0);
            sentence.setStartWordIndex(0);
            sentence.setEndWordIndex(-1);
            sentence.setText(sentenceText.toString().trim());
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
        char last = trimmed.charAt(trimmed.length() - 1);
        return last == '.' || last == '!' || last == '?';
    }
}
