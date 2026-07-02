-- =============================================================================
-- AI Reading Studio — Phase 2 audio
-- Chạy SAU migrations/032_stories.sql
--
--   mysql -u root -p course_english < migrations/033_story_audio.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `story_audio` (
  `id`                      CHAR(36)      NOT NULL,
  `story_id`                CHAR(36)      NOT NULL,
  `voice`                   VARCHAR(64)   NOT NULL,
  `tts_provider`            VARCHAR(32)   NOT NULL DEFAULT 'edge',
  `alignment_provider`      VARCHAR(32)   DEFAULT NULL,
  `audio_url`               VARCHAR(1024) NOT NULL,
  `duration`                DECIMAL(10,3) DEFAULT NULL,
  `word_timeline_json`      MEDIUMTEXT    DEFAULT NULL,
  `sentence_timeline_json`  MEDIUMTEXT    DEFAULT NULL,
  `content_hash`            CHAR(64)      NOT NULL COMMENT 'SHA-256 content+voice+providers',
  `created_at`              DATETIME(6)   DEFAULT NULL,
  `created_by`              VARCHAR(255)  DEFAULT NULL,
  `updated_at`              DATETIME(6)   DEFAULT NULL,
  `updated_by`              VARCHAR(255)  DEFAULT NULL,
  `voided`                  TINYINT(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_story_audio_story` (`story_id`),
  KEY `idx_story_audio_hash` (`story_id`, `content_hash`),
  KEY `idx_story_audio_voided` (`voided`),
  CONSTRAINT `fk_story_audio_story`
    FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
