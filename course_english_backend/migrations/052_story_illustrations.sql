-- =============================================================================
-- AI Reading Studio — Phase 5 Storybook illustrations
-- Chạy SAU migrations/036_tts_voice_catalog.sql (và các story migrations trước đó)
--
--   mysql -u root -p course_english < migrations/052_story_illustrations.sql
--
-- UX: docs/STORYBOOK_READER_UX.md
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

ALTER TABLE `stories`
  ADD COLUMN IF NOT EXISTS `visual_profile_json` TEXT DEFAULT NULL
    COMMENT 'artStyle, colorStyle, lighting, mood';

ALTER TABLE `stories`
  ADD COLUMN IF NOT EXISTS `characters_json` TEXT DEFAULT NULL
    COMMENT 'character profiles + referenceImageUrl';

ALTER TABLE `stories`
  ADD COLUMN IF NOT EXISTS `illustration_status` VARCHAR(32) NOT NULL DEFAULT 'NONE'
    COMMENT 'NONE|ANALYZED|GENERATING|PARTIAL|READY|FAILED';

ALTER TABLE `stories`
  ADD COLUMN IF NOT EXISTS `illustration_last_error` TEXT DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `story_scenes` (
  `id`                 CHAR(36)     NOT NULL,
  `story_id`           CHAR(36)     NOT NULL,
  `scene_index`        INT          NOT NULL,
  `sentence_start`     INT          NOT NULL DEFAULT 0,
  `sentence_end`       INT          NOT NULL DEFAULT 0,
  `description`        TEXT         DEFAULT NULL,
  `location`           VARCHAR(255) DEFAULT NULL,
  `characters_json`    TEXT         DEFAULT NULL COMMENT 'JSON array of character names in scene',
  `segments_json`      MEDIUMTEXT   DEFAULT NULL COMMENT 'narration/dialogue segments',
  `image_prompt`       TEXT         DEFAULT NULL,
  `image_url`          VARCHAR(1024) DEFAULT NULL,
  `status`             VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
    COMMENT 'PENDING|READY|FAILED',
  `error_message`      TEXT         DEFAULT NULL,
  `created_at`         DATETIME(6)  DEFAULT NULL,
  `created_by`         VARCHAR(255) DEFAULT NULL,
  `updated_at`         DATETIME(6)  DEFAULT NULL,
  `updated_by`         VARCHAR(255) DEFAULT NULL,
  `voided`             TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_story_scenes_story_index` (`story_id`, `scene_index`),
  KEY `idx_story_scenes_story` (`story_id`),
  KEY `idx_story_scenes_voided` (`voided`),
  CONSTRAINT `fk_story_scenes_story`
    FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
