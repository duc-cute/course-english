package com.courseenglish.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Cache phát âm dùng chung mọi story: mỗi word_key sinh IPA / audio TTS một lần.
 */
@Entity
@Table(name = "word_pronunciation_cache")
@Getter
@Setter
public class WordPronunciationCache extends BaseObject {

    @Column(name = "word_key", nullable = false, unique = true, length = 128)
    private String wordKey;

    @Column(name = "word_en", nullable = false)
    private String wordEn;

    @Column(length = 255)
    private String phonetic;

    /** ai | dictionary */
    @Column(name = "phonetic_source", length = 16)
    private String phoneticSource;

    @Column(name = "part_of_speech", length = 64)
    private String partOfSpeech;

    @Column(name = "audio_url", length = 1024)
    private String audioUrl;

    @Column(name = "audio_uk_url", length = 1024)
    private String audioUkUrl;

    @Column(name = "tts_provider", length = 32)
    private String ttsProvider;

    @Column(name = "tts_voice", length = 64)
    private String ttsVoice;
}
