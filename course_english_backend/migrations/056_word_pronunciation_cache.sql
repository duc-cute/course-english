-- =============================================================================
-- AI Reading Studio — Cache phát âm từ (IPA + audio TTS) dùng chung mọi story
-- Chạy SAU migrations/055_story_format_visual_style.sql
--
--   mysql -u root -p course_english < migrations/056_word_pronunciation_cache.sql
--
-- Mỗi word_key chỉ sinh IPA/audio một lần; story glossary enrich chạy nền sau khi Lưu.
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `word_pronunciation_cache` (
  `id`              CHAR(36)      NOT NULL,
  `word_key`        VARCHAR(128)  NOT NULL,
  `word_en`         VARCHAR(255)  NOT NULL,
  `phonetic`        VARCHAR(255)  DEFAULT NULL COMMENT 'IPA không dấu /',
  `phonetic_source` VARCHAR(16)   DEFAULT NULL COMMENT 'ai | dictionary',
  `part_of_speech`  VARCHAR(64)   DEFAULT NULL,
  `audio_url`       VARCHAR(1024) DEFAULT NULL COMMENT 'TTS audio (US)',
  `audio_uk_url`    VARCHAR(1024) DEFAULT NULL COMMENT 'dictionary audio UK nếu có',
  `tts_provider`    VARCHAR(32)   DEFAULT NULL,
  `tts_voice`       VARCHAR(64)   DEFAULT NULL,
  `created_at`      DATETIME(6)   DEFAULT NULL,
  `created_by`      VARCHAR(255)  DEFAULT NULL,
  `updated_at`      DATETIME(6)   DEFAULT NULL,
  `updated_by`      VARCHAR(255)  DEFAULT NULL,
  `voided`          TINYINT(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_word_pron_key` (`word_key`),
  KEY `idx_word_pron_voided` (`voided`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
